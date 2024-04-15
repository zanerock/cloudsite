import { AccountClient, ListRegionsCommand } from '@aws-sdk/client-account'
import { CreatePolicyCommand, IAMClient, ListPoliciesCommand } from '@aws-sdk/client-iam'
import { IdentitystoreClient, ListGroupsCommand } from '@aws-sdk/client-identitystore'
import {
  CreateInstanceCommand,
  DescribeInstanceCommand,
  ListInstancesCommand,
  SSOAdminClient
} from '@aws-sdk/client-sso-admin'

import { generateIAMPolicy } from '../shared/generate-iam-policy'
import { getCredentials } from './lib/get-credentials'
import { progressLogger } from '../shared/progress-logger'

const setupSSO = async ({ db, groupName, instanceName, instanceRegion, policyName, ssoProfile, userName }) => {
  const credentials = getCredentials()

  const policyARN = await setupPolicy({ credentials, db, policyName })
  const { identityStoreID, identityStoreRegion } =
    await setupIdentityStore({ credentials, instanceName, instanceRegion })
  const groupID = await setupSSOGroup({ credentials, identityStoreID, identityStoreRegion, groupName, policyARN })
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

  let nextToken, identityStoreID, identityStoreRegion
  const accountClient = new AccountClient({ credentials })

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

    for (const { RegionName: region, RegionOptStatus: optStatus } of regions) {
      DEBUG
      const ssoAdminClient = new SSOAdminClient({ credentials, region })
      const listInstancesCommand = new ListInstancesCommand({})
      const listInstancesResult = await ssoAdminClient.send(listInstancesCommand)
      if (listInstancesResult.Instances.length > 0) {
        const instance = listInstancesResult.Instances[0]
        identityStoreID = instance.IdentityStoreId
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

    const ssoAdminClient = new SSOAdminClient({ credentials, region : instanceRegion })
    const createInstanceCommand = new CreateInstanceCommand({ Name : instanceName })
    try {
      const createInstanceResults = await ssoAdminClient.send(createInstanceCommand)
      const { InstanceArn: instanceARN } = createInstanceResults

      const describeInstanceCommand = new DescribeInstanceCommand({ InstanceArn : instanceARN })
      const describeInstanceResults = await ssoAdminClient.send(describeInstanceCommand)

      identityStoreID = describeInstanceResults.IdentityStoreId
      identityStoreRegion = region

      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }

  return { identityStoreID, identityStoreRegion }
}

const setupSSOGroup = async ({ credentials, identityStoreID, identityStoreRegion, groupName, policyARN }) => {
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
      const createGroupResult = await iamClient.send(createGroupCommand)
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
