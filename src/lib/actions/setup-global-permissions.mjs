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

import { generateIAMPolicy } from '../shared/generate-iam-policy'
import { progressLogger } from '../shared/progress-logger'
import { searchGroups } from './lib/search-groups'
import { searchPermissionSets } from './lib/search-permission-sets'
import { searchPolicies } from './lib/search-policies'
import { SSO_POLICY_CONTENT_MANAGER, SSO_GROUP_CONTENT_MANAGERS } from '../shared/constants'

const setupGlobalPermissions =
    async ({ accountID, credentials, db, globalOptions, identityStoreARN, identityStoreID, identityStoreRegion }) => {
      const iamClient = new IAMClient({ credentials })

      const { policyARN } = await setupPolicy({ db, iamClient, globalOptions })

      const identityStoreClient = new IdentitystoreClient({ credentials, region : identityStoreRegion })

      const { groupID } =
      await setupSSOGroup({ db, identityStoreClient, identityStoreID, identityStoreRegion })

      const ssoAdminClient = new SSOAdminClient({ credentials, region : identityStoreRegion })

      const { createdNewPermissionSet, permissionSetARN } =
      await setupPermissionSet({ db, identityStoreARN, policyARN, ssoAdminClient })
      await setupPermissionSetPolicy({
        db,
        identityStoreARN,
        permissionSetARN,
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

const setupPolicy = async ({ db, globalOptions, iamClient }) => {
  progressLogger.write(`Checking status of policy '${SSO_POLICY_CONTENT_MANAGER}'... `)

  let { policyARN } = db.account

  if (policyARN !== undefined) {
    progressLogger.write('\nFound policy ARN in local database... ')

    const getPolicyCommand = new GetPolicyCommand({ PolicyArn : policyARN })
    const getPolicyResult = iamClient.send(getPolicyCommand)
    const retrievedName = getPolicyResult.Policy.PolicyName
    if (SSO_POLICY_CONTENT_MANAGER === retrievedName) {
      progressLogger.write('name match verified.\n')
    } else {
      progressLogger.write(`\n<error>!! ERROR !!<rst> Names do not match. Found '${retrievedName}', expected '${SSO_POLICY_CONTENT_MANAGER}'. (Policy name is required.)`)
      throw new Error('Policy name mismatch.')
    }
  } else {
    policyARN = searchPolicies({ iamClient })

    if (policyARN !== undefined) {
      progressLogger.write(' FOUND existing.\n')
      db.account.policyARN = policyARN
      db.account.policyName = SSO_POLICY_CONTENT_MANAGER
    } else {
      progressLogger.write(' CREATING...')

      const iamPolicy = await generateIAMPolicy({ db, globalOptions })

      const createPolicyCommand = new CreatePolicyCommand({
        PolicyName     : SSO_POLICY_CONTENT_MANAGER,
        PolicyDocument : JSON.stringify(iamPolicy, null, '  ')
      })

      try {
        const createPolicyResult = await iamClient.send(createPolicyCommand)
        policyARN = createPolicyResult.Policy.Arn
        db.account.policyName = SSO_POLICY_CONTENT_MANAGER
        db.account.policyARN = policyARN
        progressLogger.write(' CREATED.\n')
      } catch (e) {
        progressLogger.write(' ERROR while creating.\n')
        throw e
      }
    }
  }

  return { policyARN }
}

const setupPermissionSet = async ({ db, identityStoreARN, ssoAdminClient }) => {
  progressLogger.write(`Looking for permission set '${SSO_POLICY_CONTENT_MANAGER}'... `)
  let { permissionSetARN } = db.account

  let createdNewPermissionSet = false
  if (permissionSetARN !== undefined) {
    progressLogger.write('found permission set ARN in local DB.\n')
  } else {
    permissionSetARN = searchPermissionSets({ identityStoreARN, ssoAdminClient })

    if (permissionSetARN !== undefined) {
      progressLogger.write(' FOUND.\n')
    } else {
      progressLogger.write(' CREATING...')

      const createPermissionSetCommand = new CreatePermissionSetCommand({
        Name            : SSO_POLICY_CONTENT_MANAGER,
        InstanceArn     : identityStoreARN,
        SessionDuration : 'PT4H'
      })
      try {
        permissionSetARN = (await ssoAdminClient.send(createPermissionSetCommand)).PermissionSet.PermissionSetArn
        db.account.permissionSetARN = permissionSetARN
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
  searchExisting,
  ssoAdminClient
}) => {
  progressLogger.write(`Checking permission set '${SSO_POLICY_CONTENT_MANAGER}' associated policies...`)

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
        if (name === SSO_POLICY_CONTENT_MANAGER) {
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
        CustomerManagedPolicyReference : { Name : SSO_POLICY_CONTENT_MANAGER }
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

const setupSSOGroup = async ({ db, identityStoreClient, identityStoreID }) => {
  progressLogger.write(`Checking for SSO group '${SSO_GROUP_CONTENT_MANAGERS}'... `)

  let { groupID } = db.account

  if (groupID !== undefined) {
    progressLogger.write('\nFound group ID in local database...')

    const getGroupIDCommand = new GetGroupIdCommand({
      IdentityStoreId : identityStoreID,
      UniqueAttribute : {
        AttributePath  : 'displayName',
        AttributeValue : SSO_GROUP_CONTENT_MANAGERS
      }
    })
    const getGroupIDResult = await identityStoreClient.send(getGroupIDCommand)
    if (getGroupIDResult.GroupId === groupID) {
      progressLogger.write('CONFIRMED\n')
      return
    } else {
      progressLogger.write('ERROR')
      throw new Error('Group name/id mismatch.')
    }
  }

  groupID = searchGroups({ identityStoreClient, identityStoreID })

  if (groupID !== undefined) {
    progressLogger.write(' FOUND existing.\n')
  } else {
    progressLogger.write(' CREATING...')

    const createGroupCommand = new CreateGroupCommand({
      IdentityStoreId : identityStoreID,
      DisplayName     : SSO_GROUP_CONTENT_MANAGERS
    })

    try {
      const createGroupResult = await identityStoreClient.send(createGroupCommand)
      groupID = createGroupResult.GroupId
      db.account.groupID = groupID
      db.account.groupName = SSO_GROUP_CONTENT_MANAGERS
      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR while creating.\n')
      throw e
    }
  }

  return { groupID }
}

export { setupGlobalPermissions }
