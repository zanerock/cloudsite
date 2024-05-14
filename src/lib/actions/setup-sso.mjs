import {
  CreatePolicyCommand,
  DeleteAccessKeyCommand,
  IAMClient,
  ListAccessKeysCommand,
  ListPoliciesCommand
} from '@aws-sdk/client-iam'
import {
  CreateGroupCommand,
  CreateGroupMembershipCommand,
  CreateUserCommand,
  IdentitystoreClient,
  ListGroupsCommand,
  ListUsersCommand
} from '@aws-sdk/client-identitystore'
import {
  AttachCustomerManagedPolicyReferenceToPermissionSetCommand,
  CreateAccountAssignmentCommand,
  // CreateInstanceCommand,
  CreatePermissionSetCommand,
  // DescribeInstanceCommand,
  DescribePermissionSetCommand,
  ListAccountAssignmentsCommand,
  ListCustomerManagedPolicyReferencesInPermissionSetCommand,
  ListPermissionSetsCommand,
  UpdateInstanceCommand
} from '@aws-sdk/client-sso-admin'

import { Questioner } from 'question-and-answer'

import { findIdentityStore } from '../shared/find-identity-store'
import { generateIAMPolicy } from '../shared/generate-iam-policy'
import { progressLogger } from '../shared/progress-logger'

const setupSSO = async ({
  credentials,
  db,
  doDelete,
  groupName,
  identityStoreInfo,
  instanceName,
  policyName,
  ssoProfile,
  userEmail,
  userFamilyName,
  userGivenName,
  userName
}) => {
  const { accountID } = db.account

  const { iamClient, policyARN } = await setupPolicy({ credentials, db, policyName })
  const { identityStoreID, identityStoreRegion, instanceARN, ssoAdminClient, ssoStartURL } =
    await setupIdentityStore({ credentials, identityStoreInfo, instanceName })
  const { groupID, identityStoreClient } =
    await setupSSOGroup({ credentials, identityStoreID, identityStoreRegion, groupName })
  const permissionSetARN = await setupPermissionSet({ instanceARN, policyARN, policyName, ssoAdminClient })
  await setupAccountAssignment({ accountID, groupID, instanceARN, permissionSetARN, ssoAdminClient })
  await setupUser({
    groupID,
    groupName,
    identityStoreClient,
    identityStoreID,
    identityStoreRegion,
    instanceARN,
    ssoProfile,
    userEmail,
    userFamilyName,
    userGivenName,
    userName
  })

  if (doDelete === true) {
    progressLogger.write('Checking Access Keys...')

    let marker
    let accessKeyID = false
    let activeCount = 0
    do {
      const listAccessKeysCommand = new ListAccessKeysCommand({
        Marker : marker
      })
      const listAccessKeysResult = await iamClient.send(listAccessKeysCommand)
      for (const { AccessKeyId: testKeyID, Status: status } of listAccessKeysResult.AccessKeyMetadata) {
        if (status === 'Active') {
          accessKeyID = activeCount === 0 && testKeyID
          activeCount += 1
        }
      }

      marker = listAccessKeysResult.Marker
    } while (accessKeyID === undefined && marker !== undefined)

    if (accessKeyID === false && activeCount > 1) {
      progressLogger.write(' MULTIPLE keys found.\nSkipping Access Key deletion.')
    } else if (accessKeyID === false) {
      progressLogger.write(' NO KEYS FOUND.\n')
    } else {
      progressLogger.write(' DELETING...')
      const deleteAccessKeyCommand = new DeleteAccessKeyCommand({ AccessKeyId : accessKeyID })

      try {
        await iamClient.send(deleteAccessKeyCommand)
        progressLogger.write('  DONE.\n')
      } catch (e) {
        progressLogger.write('  ERROR.\n')
        throw e
      }
    }
  } else {
    progressLogger.write('Leaving Access Keys in place.\n')
  }

  return { ssoStartURL, ssoRegion : identityStoreRegion }
}

const setupAccountAssignment = async ({ accountID, groupID, instanceARN, permissionSetARN, ssoAdminClient }) => {
  progressLogger.write('Checking for account assignment...')

  let found = false
  let nextToken
  do {
    const listAccountAssignmentsCommand = new ListAccountAssignmentsCommand({
      InstanceArn      : instanceARN,
      AccountId        : accountID,
      PermissionSetArn : permissionSetARN,
      NextToken        : nextToken
    })
    const listAccountAssignmentsResults = await ssoAdminClient.send(listAccountAssignmentsCommand)
    for (const { PrincipalType: principalType, PrincipalId: principalID }
      of listAccountAssignmentsResults.AccountAssignments) {
      if (principalType === 'GROUP' && principalID === groupID) {
        found = true
      }
    }
    nextToken = listAccountAssignmentsResults.NextToken
  } while (found === false && nextToken !== undefined)

  if (found === true) {
    progressLogger.write(' FOUND.\n')
  } else {
    progressLogger.write(' CREATING...')
    const createAccountAssignmentCommand = new CreateAccountAssignmentCommand({
      InstanceArn      : instanceARN,
      TargetId         : accountID,
      TargetType       : 'AWS_ACCOUNT',
      PermissionSetArn : permissionSetARN,
      PrincipalType    : 'GROUP',
      PrincipalId      : groupID
    })

    try {
      await ssoAdminClient.send(createAccountAssignmentCommand)
      progressLogger.write(' DONE.\n')
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }
}

const setupPolicy = async ({ credentials, db, policyName }) => {
  progressLogger.write(`Checking status of policy '${policyName}'...`)

  let marker
  let policyARN
  const iamClient = new IAMClient({ credentials })

  do {
    const listPoliciesCommand = new ListPoliciesCommand({
      Scope             : 'Local',
      PolicyUsageFilter : 'PermissionsPolicy',
      Marker            : marker
    })

    const listPoliciesResults = await iamClient.send(listPoliciesCommand)

    for (const { PolicyName: testPolicyName, Arn: arn } of listPoliciesResults.Policies) {
      if (testPolicyName.toLowerCase() === policyName.toLowerCase()) { // policy names must be case-insensitive unique
        policyARN = arn
        break
      }
    }

    marker = listPoliciesResults.Marker
  } while (policyARN === undefined && marker !== undefined)

  if (policyARN !== undefined) {
    progressLogger.write(' FOUND existing.\n')
  } else {
    progressLogger.write(' CREATING...')

    const iamPolicy = await generateIAMPolicy({ db })

    const createPolicyCommand = new CreatePolicyCommand({
      PolicyName     : policyName,
      PolicyDocument : JSON.stringify(iamPolicy, null, '  ')
    })

    try {
      const createPolicyResult = await iamClient.send(createPolicyCommand)
      policyARN = createPolicyResult.Policy.Arn
      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR while creating.\n')
      throw e
    }
  }

  return { iamClient, policyARN }
}

const setupIdentityStore = async ({ credentials, identityStoreInfo, instanceName }) => {
  let {
    id: identityStoreID,
    region: identityStoreRegion,
    instanceARN,
    ssoAdminClient,
    ssoStartURL
  } = identityStoreInfo

  const firstRun = true
  let tryCount = 0
  const maxTryCount = 4
  while (identityStoreID === undefined) {
    tryCount += 1

    if (tryCount === maxTryCount) {
      throw new Error('Something appears to be wrong. If the network is unstable or you suspect some other transient error, try again later. You may also look into Cloudsite support options:\n\n<em>https://cloudsitehosting.org/support<rst>')
    }
    const interrogationBundle = { actions : [] }

    const userMessage = firstRun === true
      ? '\nIt is not currently possible to create an AWS Identity Center instance programmatically. Thankfully, creating one manually is easy, just follow the following instructions.'
      : "\n<warn>No Identity Center instance was found.<rst> You may have hit <RETURN> before the Identity Center creation finished, or maybe you didn't hit the 'Enable' button. Try the following URL."
    interrogationBundle.actions.push({ statement : userMessage })
    interrogationBundle.actions.push({
      prompt    : `\n1) Copy the following URL into a browser:\n\n<em>https://${identityStoreRegion}.console.aws.amazon.com/singlesignon/home?region=${identityStoreRegion}#!/<rst>\n\n2) Hit the 'Enable' button.\n3) Return here and hit <ENTER> to continue the automated setup.`,
      parameter : 'IGNORE_ME'
    })

    const questioner = new Questioner({
      interrogationBundle,
      output : progressLogger
    })
    await questioner.question()

    const findIdentityStoreResult =
      await findIdentityStore({ credentials, instanceRegion : identityStoreRegion })
    if (findIdentityStoreResult.id !== undefined) {
      ({
        id: identityStoreID,
        region: identityStoreRegion,
        instanceARN
      } = findIdentityStoreResult)

      const updateInstanceCommand = new UpdateInstanceCommand({
        Name        : instanceName,
        InstanceArn : instanceARN
      })
      await ssoAdminClient.send(updateInstanceCommand)

      ssoStartURL = 'https://' + identityStoreID + '.awsapps.com/start'
    } // else we loop and try again.

    /* This is what we'd like to do, but AWS inexplicably does not permit you to create a Organization based Instance from the API, even though this is the recommended way to create an instance and the only way that works with permissions and such.

    progressLogger.write(`Creating identity store '${instanceName}'...`)

    const createInstanceCommand = new CreateInstanceCommand({ Name : instanceName })
    try {
      const createInstanceResults = await ssoAdminClient.send(createInstanceCommand);
      ({ InstanceArn: instanceARN } = createInstanceResults)

      const describeInstanceCommand = new DescribeInstanceCommand({ InstanceArn : instanceARN })
      const describeInstanceResults = await ssoAdminClient.send(describeInstanceCommand)

      identityStoreID = describeInstanceResults.IdentityStoreId
      identityStoreRegion = instanceRegion
      ssoStartURL = 'https://' + describeInstanceResults.Name + '.awsapps.com/start'

      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
    */
  }

  return { identityStoreID, identityStoreRegion, instanceARN, ssoAdminClient, ssoStartURL }
}

const setupPermissionSet = async ({ instanceARN, policyARN, policyName, ssoAdminClient }) => {
  progressLogger.write(`Looking for permission set '${policyName}'...`)
  let nextToken, permissionSetARN
  do {
    const listPermissionSetsCommand = new ListPermissionSetsCommand({ InstanceArn : instanceARN })
    const listPermissionSetsResult = await ssoAdminClient.send(listPermissionSetsCommand)
    for (const testARN of listPermissionSetsResult.PermissionSets) {
      const describePermissionSetCommand = new DescribePermissionSetCommand({
        InstanceArn      : instanceARN,
        PermissionSetArn : testARN
      })
      const { Name: name } = (await ssoAdminClient.send(describePermissionSetCommand)).PermissionSet

      if (name === policyName) {
        permissionSetARN = testARN
        break
      }
    }
    nextToken = listPermissionSetsResult.NextToken
  } while (permissionSetARN === undefined && nextToken !== undefined)

  if (permissionSetARN !== undefined) {
    progressLogger.write(' FOUND.\n')
    await setupPermissionSetPolicy({
      instanceARN,
      permissionSetARN,
      policyName,
      searchExisting : true,
      ssoAdminClient
    })
  } else {
    progressLogger.write(' CREATING...')

    const createPermissionSetCommand = new CreatePermissionSetCommand({
      Name            : policyName,
      InstanceArn     : instanceARN,
      SessionDuration : 'PT4H'
    })
    try {
      permissionSetARN = (await ssoAdminClient.send(createPermissionSetCommand)).PermissionSet.PermissionSetArn
      progressLogger.write(' CREATED.\n')
      await setupPermissionSetPolicy({
        instanceARN,
        permissionSetARN,
        policyARN,
        policyName,
        searchExisting : false,
        ssoAdminClient
      })
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }

  return permissionSetARN
}

const setupPermissionSetPolicy = async ({
  instanceARN,
  permissionSetARN,
  policyName,
  searchExisting,
  ssoAdminClient
}) => {
  progressLogger.write(`Checking permission set '${policyName}' associated policies...`)
  let policyFound = false
  if (searchExisting === true) {
    let nextToken
    do {
      const listCustomerManagedPolicyReferencesInPermissionSetCommand =
        new ListCustomerManagedPolicyReferencesInPermissionSetCommand({
          InstanceArn      : instanceARN,
          PermissionSetArn : permissionSetARN,
          NextToken        : nextToken
        })

      const listCustomerManagedPolicyReferencesInPermissionSetResults =
        await ssoAdminClient.send(listCustomerManagedPolicyReferencesInPermissionSetCommand)

      for (const { Name : name } of
        listCustomerManagedPolicyReferencesInPermissionSetResults.CustomerManagedPolicyReferences) {
        if (name === policyName) {
          policyFound = true
        }
      }
      nextToken = listCustomerManagedPolicyReferencesInPermissionSetResults.NextToken
    } while (policyFound === false && nextToken !== undefined)
  }

  if (policyFound === true) {
    progressLogger.write(' FOUND.\n')
  } else {
    progressLogger.write(' ASSOCIATING...')
    const attachCustomerManagedPolicyReferenceToPermissionSetCommand =
      new AttachCustomerManagedPolicyReferenceToPermissionSetCommand({
        InstanceArn                    : instanceARN,
        PermissionSetArn               : permissionSetARN,
        CustomerManagedPolicyReference : { Name : policyName }
      })
    try {
      await ssoAdminClient.send(attachCustomerManagedPolicyReferenceToPermissionSetCommand)
      progressLogger.write(' DONE.\n')
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }
}

const setupSSOGroup = async ({ credentials, identityStoreID, identityStoreRegion, groupName }) => {
  progressLogger.write(`Checking for SSO group '${groupName}'...`)

  let nextToken
  let groupID
  const identityStoreClient = new IdentitystoreClient({ credentials, region : identityStoreRegion })
  do {
    const listGroupsCommand = new ListGroupsCommand({
      IdentityStoreId : identityStoreID,
      NextToken       : nextToken
    })
    const listGroupsCommandResult = await identityStoreClient.send(listGroupsCommand)

    for (const { GroupId: testGroupID, DisplayName: displayName } of listGroupsCommandResult.Groups) {
      if (displayName === groupName) {
        groupID = testGroupID
        break
      }
    }

    nextToken = listGroupsCommandResult.NextToken
  } while (groupID === undefined && nextToken !== undefined)

  if (groupID !== undefined) {
    progressLogger.write(' FOUND existing.\n')
  } else {
    progressLogger.write(' CREATING...')

    const createGroupCommand = new CreateGroupCommand({
      IdentityStoreId : identityStoreID,
      DisplayName     : groupName
    })

    try {
      const createGroupResult = await identityStoreClient.send(createGroupCommand)
      groupID = createGroupResult.GroupId
      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR while creating.\n')
      throw e
    }
  }

  return { groupID, identityStoreClient }
}

const setupUser = async ({
  groupID,
  groupName,
  identityStoreClient,
  identityStoreID,
  identityStoreRegion,
  instanceARN,
  ssoProfile,
  userEmail,
  userFamilyName,
  userGivenName,
  userName
}) => {
  progressLogger.write(`Checking for user '${userName}'...`)

  let nextToken, userID
  do {
    const listUsersCommand = new ListUsersCommand({
      IdentityStoreId : identityStoreID,
      NextToken       : nextToken
    })
    const listUsersResults = await identityStoreClient.send(listUsersCommand)

    for (const { UserName: testName, UserId: testID } of listUsersResults.Users) {
      if (testName === userName) {
        userID = testID
      }
    }

    nextToken = listUsersResults.NextToken
  } while (userID === undefined && nextToken !== undefined)

  if (userID !== undefined) {
    progressLogger.write(' FOUND.\n')
  } else {
    progressLogger.write(' CREATING...')

    const createUserCommand = new CreateUserCommand({
      IdentityStoreId : identityStoreID,
      UserName        : userName,
      DisplayName     : userName,
      Name            : { GivenName : userGivenName, FamilyName : userFamilyName },
      Emails          : [{ Value : userEmail, Primary : true }]
    })
    try {
      userID = (await identityStoreClient.send(createUserCommand)).UserId
      progressLogger.write(' DONE.\n')

      const arnBits = instanceARN.split('/')
      const instanceShortID = arnBits[arnBits.length - 1].split('-')[1]

      const usersURL = `https://${identityStoreRegion}.console.aws.amazon.com/singlesignon/home?region=${identityStoreRegion}#!/instances/${instanceShortID}/users`

      progressLogger.write(`<warn>You must request AWS email '${userName}' an email verification link from the Identity Center Console<rst>.\n\n1) Navigate to the following URL:\n\n<em>${usersURL}<rst>\n\n2) Select the user '${userName}'.\n3) Click the 'Send email verification link'.\n\nOnce verified, you can authenticate, with:\n\n<em>aws sso login --profile ${ssoProfile}<rst>\n\n`)
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }

  progressLogger.write(`Associating user '${userName}' with group '${groupName}'...`)
  const createGroupMembershipCommand = new CreateGroupMembershipCommand({
    IdentityStoreId : identityStoreID,
    GroupId         : groupID,
    MemberId        : { UserId : userID }
  })
  try {
    await identityStoreClient.send(createGroupMembershipCommand)
    progressLogger.write(' DONE.\n')
  } catch (e) {
    if (e.Reason === 'UNIQUENESS_CONSTRAINT_VIOLATION') { // already a member
      progressLogger.write(' DONE.\n')
    } else {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }
}

export { setupSSO }
