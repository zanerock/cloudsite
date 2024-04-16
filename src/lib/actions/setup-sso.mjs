import { AccountClient, ListRegionsCommand } from '@aws-sdk/client-account'
import { CreatePolicyCommand, IAMClient, ListPoliciesCommand } from '@aws-sdk/client-iam'
import { CreateGroupCommand, IdentitystoreClient, ListGroupsCommand } from '@aws-sdk/client-identitystore'
import {
  AttachCustomerManagedPolicyReferenceToPermissionSetCommand,
  CreateAccountAssignmentCommand,
  CreateInstanceCommand,
  CreatePermissionSetCommand,
  DescribeInstanceCommand,
  DescribePermissionSetCommand,
  ListAccountAssignmentsCommand,
  ListCustomerManagedPolicyReferencesInPermissionSetCommand,
  ListInstancesCommand,
  ListPermissionSetsCommand,
  SSOAdminClient
} from '@aws-sdk/client-sso-admin'

import { generateIAMPolicy } from '../shared/generate-iam-policy'
import { getCredentials } from './lib/get-credentials'
import { progressLogger } from '../shared/progress-logger'

const setupSSO = async ({ db, groupName, instanceName, instanceRegion, policyName, ssoProfile, userName }) => {
  const credentials = getCredentials()

  const { accountID } = db.account

  const policyARN = await setupPolicy({ credentials, db, policyName })
  const { identityStoreID, identityStoreRegion, instanceARN, ssoAdminClient } =
    await setupIdentityStore({ credentials, instanceName, instanceRegion })
  const groupID = await setupSSOGroup({ credentials, identityStoreID, identityStoreRegion, groupName })
  const permissionSetARN = await setupPermissionSet({ credentials, instanceARN, policyARN, policyName, ssoAdminClient })
  await setupAccountAssignment({ accountID, groupID, instanceARN, permissionSetARN, ssoAdminClient })
}

const setupAccountAssignment = async ({ accountID, groupID, instanceARN, permissionSetARN, ssoAdminClient }) => {
  progressLogger.write('Checking for account assignment...')

  let found = false
  let nextToken
  do {
    const listAccountAssignmentsCommand = new ListAccountAssignmentsCommand({
      InstanceArn : instanceARN,
      AccountId   : accountID,
      PermissionSetArn: permissionSetARN,
      NextToken   : nextToken
    })
    const listAccountAssignmentsResults = await ssoAdminClient.send(listAccountAssignmentsCommand)
    for (const { PrincipalType: principalType, PrincipalId: principalID }
      of listAccountAssignmentsResults.AccountAssignments) {
      if (principalType === 'GROUP' && principalID === groupID) {
        found = true
      }
    }
  } while (found === false && nextToken !== undefined)

  if (found === true) {
    progressLogger.write(' FOUND.\n')
  }
  else {
    progressLogger.write(' CREATING...')
    const createAccountAssignmentCommand = new CreateAccountAssignmentCommand({
      InstanceArn: instanceARN,
      TargetId: accountID,
      TargetType: 'AWS_ACCOUNT',
      PermissionSetArn: permissionSetARN,
      PrincipalType: 'GROUP',
      PrincipalId: groupID
    })

    try {
      await ssoAdminClient.send(createAccountAssignmentCommand)
      progressLogger.write(' DONE.\n')
    }
    catch (e) {
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

  return policyARN
}

const setupIdentityStore = async ({ credentials, instanceName, instanceRegion }) => {
  progressLogger.write('Checking for SSO identity store...')

  let nextToken, identityStoreID, identityStoreRegion, instanceARN
  const accountClient = new AccountClient({ credentials })
  let ssoAdminClient

  do {
    const listRegionsCommand = new ListRegionsCommand({
      MaxResults              : 50, // max allowed as of 2024-04-15
      NextToken               : nextToken,
      RegionOptStatusContains : ['ENABLED', 'ENABLED_BY_DEFAULT']
    })
    const listRegionsResult = await accountClient.send(listRegionsCommand)

    const regions = listRegionsResult.Regions.sort((a, b) => {
      const aName = a.RegionName
      const bName = b.RegionName

      const aUS = aName.startsWith('us-')
      const bUS = bName.startsWith('us-')

      if (aName === instanceRegion) {
        return -1
      } else if (bName === instanceRegion) {
        return 1
      } else if (aUS === true && bUS === false) {
        return -1
      } else if (aUS === false && bUS === true) {
        return 1
      } else {
        return aName.localeCompare(bName)
      }
    })

    for (const { RegionName: region } of regions) {
      ssoAdminClient = new SSOAdminClient({ credentials, region })
      const listInstancesCommand = new ListInstancesCommand({})
      const listInstancesResult = await ssoAdminClient.send(listInstancesCommand)
      if (listInstancesResult.Instances.length > 0) {
        const instance = listInstancesResult.Instances[0]
        identityStoreID = instance.IdentityStoreId
        instanceARN = instance.InstanceArn
        identityStoreRegion = region
        break
      }
    }
    nextToken = listRegionsResult.NextToken
  } while (identityStoreID === undefined && nextToken !== undefined)

  if (identityStoreID !== undefined) {
    progressLogger.write(' FOUND.\n')
  } else {
    progressLogger.write(' CREATING...')

    const createInstanceCommand = new CreateInstanceCommand({ Name : instanceName })
    try {
      const createInstanceResults = await ssoAdminClient.send(createInstanceCommand);
      ({ InstanceArn: instanceARN } = createInstanceResults)

      const describeInstanceCommand = new DescribeInstanceCommand({ InstanceArn : instanceARN })
      const describeInstanceResults = await ssoAdminClient.send(describeInstanceCommand)

      identityStoreID = describeInstanceResults.IdentityStoreId
      identityStoreRegion = instanceRegion

      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }

  return { identityStoreID, identityStoreRegion, instanceARN, ssoAdminClient }
}

const setupPermissionSet = async ({ credentials, instanceARN, policyARN, policyName, ssoAdminClient }) => {
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
      policyARN,
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
  policyARN,
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

  return groupID
}

export { setupSSO }
