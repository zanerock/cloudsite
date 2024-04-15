import { CreatePolicyCommand, IAMClient, ListPoliciesCommand } from '@aws-sdk/client-iam'
import { IdentitystoreClient, ListGroupsCommand } from '@aws-sdk/client-identitystore'

import { generateIAMPolicy } from '../shared/generate-iam-policy'
import { getCredentials } from './lib/get-credentials'
import { progressLogger } from '../shared/progress-logger'

const setupSSO = async ({ db, identityStoreID, identityStoreRegion, groupName, policyName, userName, ssoProfile }) => {
  const credentials = getCredentials()

  const policyARN = await setupPolicy({ credentials, db, policyName })
  const groupID = await setupSSOGroup({ credentials, identityStoreID, identityStoreRegion, groupName, policyARN })
}

const setupPolicy = async ({ credentials, db, policyName }) => {
  progressLogger.write(`Checking status of policy '${policyName}'...`)

  let marker
  let policyARN
  const iamClient = new IAMClient({ credentials })

  do {
    const listPoliciesCommand = new ListPoliciesCommand({
      Scope: 'Local',
      PolicyUsageFilter: 'PermissionsPolicy',
      Marker: marker
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
  }
  else {
    progressLogger.write(' CREATING...')

    const iamPolicy = await generateIAMPolicy({ db })

    const createPolicyCommand = new CreatePolicyCommand({
      PolicyName: policyName,
      PolicyDocument: JSON.stringify(iamPolicy, null, '  ')
    })

    try {
      const createPolicyResult = await iamClient.send(createPolicyCommand)
      policyARN = createPolicyResult.Policy.Arn
      progressLogger.write(' CREATED.\n')
    }
    catch (e) {
      progressLogger.write(' ERROR while creating.\n')
      throw e
    }
  }

  return policyARN
}

const setupSSOGroup = async ({ credentials, identityStoreID, identityStoreRegion, groupName, policyARN }) => {
  progressLogger.write(`Checking for SSO group '${groupName}'...`)

  let nextToken
  let groupID
  const identityStoreClient = new IdentitystoreClient({ credentials, region: identityStoreRegion })
  do {
    const listGroupsCommand = new ListGroupsCommand({
      IdentityStoreId: identityStoreID,
      NextToke: nextToken
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
  }
  else {
    progressLogger.write(' CREATING...')

    const createGroupCommand = new CreateGroupCommand({
      IdentityStoreId: identityStoreID,
      DisplayName: groupName
    })

    try {
      const createGroupResult = await iamClient.send(createGroupCommand)
      groupID = createGroupResult.GroupId
      progressLogger.write(' CREATED.\n')
    }
    catch (e) {
      progressLogger.write(' ERROR while creating.\n')
      throw e
    }
  }

  return groupID
}

export { setupSSO }