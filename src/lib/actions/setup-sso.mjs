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
  CreateInstanceCommand,
  CreatePermissionSetCommand,
  DescribeInstanceCommand,
  DescribePermissionSetCommand,
  ListAccountAssignmentsCommand,
  ListCustomerManagedPolicyReferencesInPermissionSetCommand,
  ListPermissionSetsCommand
} from '@aws-sdk/client-sso-admin'

import { generateIAMPolicy } from '../shared/generate-iam-policy'
import { progressLogger } from '../shared/progress-logger'

const setupSSO = async ({
  credentials,
  db,
  doDelete,
  groupName,
  identityStoreInfo,
  instanceName,
  instanceRegion,
  policyName,
  userEmail,
  userFamilyName,
  userGivenName,
  userName
}) => {
  const { accountID } = db.account

  const { iamClient, policyARN } = await setupPolicy({ credentials, db, policyName })
  const { identityStoreID, identityStoreRegion, instanceARN, ssoAdminClient, ssoStartURL } =
    await setupIdentityStore({ identityStoreInfo, instanceName, instanceRegion })
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

const setupIdentityStore = async ({ identityStoreInfo, instanceName, instanceRegion }) => {
  let {
    id: identityStoreID,
    region: identityStoreRegion,
    instanceARN,
    ssoAdminClient,
    ssoStartURL
  } = identityStoreInfo

  if (identityStoreID === undefined) {
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
      Name        : policyName,
      InstanceArn : instanceARN
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
      progressLogger.write(`<warn>You must request AWS email '${userName}' an email verification link from the Identity Center Console.\nhttps://${identityStoreRegion}.console.aws.amazon.com/singlesignon/home</warn>\n`)
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
