import {
  CreatePolicyCommand,
  GetPolicyCommand,
  IAMClient
} from '@aws-sdk/client-iam'
import {
  CreateGroupCommand,
  GetGroupIdCommand,
  IdentitystoreClient
} from '@aws-sdk/client-identitystore'
import {
  AttachCustomerManagedPolicyReferenceToPermissionSetCommand,
  CreateAccountAssignmentCommand,
  // CreateInstanceCommand,
  CreatePermissionSetCommand,
  // DescribeInstanceCommand,
  ListAccountAssignmentsCommand,
  ListCustomerManagedPolicyReferencesInPermissionSetCommand,
  SSOAdminClient
} from '@aws-sdk/client-sso-admin'

import { generateIAMPolicy } from '../../shared/generate-iam-policy'
import { getPolicyNameFromGroupName } from '../../shared/get-policy-name-from-group-name'
import { progressLogger } from '../../shared/progress-logger'
import { searchGroups } from './search-groups'
import { searchPermissionSets } from './search-permission-sets'
import { searchPolicies } from './search-policies'

const setupPermissionsGroup = async ({ credentials, db, globalOptions, groupName }) => {
  const { accountID } = db.account
  const { identityStoreARN, identityStoreID, identityStoreRegion } = db.sso.details

  const iamClient = new IAMClient({ credentials })
  const ssoAdminClient = new SSOAdminClient({ credentials, region : identityStoreRegion })

  const policyName = getPolicyNameFromGroupName(groupName)

  const { policyARN } = await setupPolicy({ db, groupName, iamClient, globalOptions, policyName })

  const identityStoreClient = new IdentitystoreClient({ credentials, region : identityStoreRegion })

  const { groupID } = await setupSSOGroup({
    db,
    groupName,
    identityStoreClient,
    identityStoreID,
    identityStoreRegion,
    policyName
  })

  const { createdNewPermissionSet, permissionSetARN } =
    await setupPermissionSet({ db, groupName, identityStoreARN, policyARN, policyName, ssoAdminClient })
  await setupPermissionSetPolicy({
    db,
    identityStoreARN,
    permissionSetARN,
    policyName,
    searchExisting : !createdNewPermissionSet,
    ssoAdminClient
  })
  await setupAccountAssignment({ accountID, groupID, identityStoreARN, permissionSetARN, ssoAdminClient })
}

const setupAccountAssignment = async ({ accountID, groupID, identityStoreARN, permissionSetARN, ssoAdminClient }) => {
  progressLogger.write('Checking for account assignment...')

  let found = false
  let nextToken
  do {
    const listAccountAssignmentsCommand = new ListAccountAssignmentsCommand({
      InstanceArn      : identityStoreARN,
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
      InstanceArn      : identityStoreARN,
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

const setupPolicy = async ({ db, groupName, globalOptions, iamClient, policyName }) => {
  progressLogger.write(`Checking status of policy '${policyName}'... `)

  let { policyARN } = db.sso.groups[groupName] || {}

  if (policyARN !== undefined) {
    progressLogger.write('\nFound policy ARN in local database... ')

    const getPolicyCommand = new GetPolicyCommand({ PolicyArn : policyARN })
    const getPolicyResult = await iamClient.send(getPolicyCommand)
    const retrievedName = getPolicyResult.Policy.PolicyName
    if (policyName === retrievedName) {
      progressLogger.write('name match verified.\n')
    } else {
      progressLogger.write(`\n<error>!! ERROR !!<rst> Names do not match. Found '${retrievedName}', expected '${policyName}'. (Policy name is required.)`)
      throw new Error('Policy name mismatch.')
    }
  } else {
    policyARN = await searchPolicies({ iamClient, policyName })

    if (policyARN !== undefined) {
      progressLogger.write(' FOUND existing; updating local DB.\n')
      if (db.sso.groups[groupName] === undefined) {
        db.sso.groups[groupName] = {}
      }
      db.sso.groups[groupName].policyARN = policyARN
    } else {
      progressLogger.write(' CREATING... ')

      const iamPolicy = await generateIAMPolicy({ db, globalOptions, groupName })

      const createPolicyCommand = new CreatePolicyCommand({
        PolicyName     : policyName,
        PolicyDocument : JSON.stringify(iamPolicy, null, '  ')
      })

      try {
        const createPolicyResult = await iamClient.send(createPolicyCommand)
        policyARN = createPolicyResult.PolicyArn
        db.sso.groups[groupName] = { policyARN }
        progressLogger.write('CREATED.\n')
      } catch (e) {
        progressLogger.write('ERROR while creating.\n')
        throw e
      }
    }
  }

  return { policyARN }
}

const setupPermissionSet = async ({ db, groupName, identityStoreARN, policyName, ssoAdminClient }) => {
  progressLogger.write(`Looking for permission set '${policyName}'... `)
  let { permissionSetARN } = db.sso.groups[groupName]

  let createdNewPermissionSet = false
  if (permissionSetARN !== undefined) {
    progressLogger.write('found permission set ARN in local DB.\n')
  } else {
    permissionSetARN = await searchPermissionSets({ identityStoreARN, policyName, ssoAdminClient })

    if (permissionSetARN !== undefined) {
      progressLogger.write(' FOUND.\n')
    } else {
      progressLogger.write(' CREATING...')

      const createPermissionSetCommand = new CreatePermissionSetCommand({
        Name            : policyName,
        InstanceArn     : identityStoreARN,
        SessionDuration : 'PT4H'
      })
      try {
        permissionSetARN = (await ssoAdminClient.send(createPermissionSetCommand)).PermissionSet.PermissionSetArn
        db.sso.groups[groupName].permissionSetARN = permissionSetARN
        progressLogger.write(' CREATED.\n')
        createdNewPermissionSet = true
      } catch (e) {
        progressLogger.write(' ERROR.\n')
        throw e
      }
    }
  }

  return { createdNewPermissionSet, permissionSetARN }
}

const setupPermissionSetPolicy = async ({
  identityStoreARN,
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
          InstanceArn      : identityStoreARN,
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
        InstanceArn                    : identityStoreARN,
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

const setupSSOGroup = async ({ db, groupName, identityStoreClient, identityStoreID }) => {
  progressLogger.write(`Checking for SSO group '${groupName}'... `)

  let { groupID } = db.sso.groups[groupName]

  if (groupID !== undefined) {
    progressLogger.write('\nFound group ID in local database; verifying data... ')

    const getGroupIDCommand = new GetGroupIdCommand({
      IdentityStoreId     : identityStoreID,
      AlternateIdentifier : {
        UniqueAttribute : {
          AttributePath  : 'displayName',
          AttributeValue : groupName
        }
      }
    })
    const getGroupIDResult = await identityStoreClient.send(getGroupIDCommand)
    if (getGroupIDResult.GroupId === groupID) {
      progressLogger.write('CONFIRMED\n')
      return { groupID }
    } else {
      progressLogger.write('ERROR')
      throw new Error('Group name/id mismatch.')
    }
  }

  groupID = await searchGroups({ groupName, identityStoreClient, identityStoreID })

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
      db.sso.groups[groupName].groupID = groupID
      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR while creating.\n')
      throw e
    }
  }

  return { groupID }
}

export { setupPermissionsGroup }
