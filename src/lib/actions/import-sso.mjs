import { IAMClient } from '@aws-sdk/client-iam'
import { IdentitystoreClient } from '@aws-sdk/client-identitystore'

import { findIdentityStoreStaged } from '../shared/find-identity-store'
import { getPolicyNameFromGroupName } from './lib/get-policy-name-from-group-name'
import { searchGroups } from './lib/search-groups'
import { searchPermissionSets } from './lib/search-permission-sets'
import { searchPolicies } from './lib/search-policies'

const doImportSSO = async ({ credentials, db }) => {
  const { identityStoreID, identityStoreRegion, identityStoreARN, ssoAdminClient } =
    await importIdentityStoreData({ credentials, db })
  const iamClient = new IAMClient({ credentials })

  const identityStoreClient = new IdentitystoreClient({ credentials, identityStoreRegion })

  const importFuncs = []
  for (const groupName of await getGroupNames()) {
    const policyName = getPolicyNameFromGroupName(groupName)
    db.sso.groups[groupName] = {}

    importFuncs.push(importGroupData({ db, groupName, identityStoreClient, identityStoreID }))
    importFuncs.push(importPermissionSet({ db, groupName, identityStoreARN, policyName, ssoAdminClient }))
    importFuncs.push(importPolicyData({ db, groupName, iamClient, policyName }))
  }

  await Promise.all(importFuncs)
}

const getGroupNames = async () => {
  throw new Error('getGroupNames() Not yet implemented.')
}

const importGroupData = async ({ db, groupName, identityStoreClient, identityStoreID }) => {
  const groupID = await searchGroups({ groupName, identityStoreClient, identityStoreID })
  db.sso.groups[groupName].groupID = groupID
}

const importIdentityStoreData = async ({ credentials, db }) => {
  const { id, identityStoreARN, identityStoreRegion, ssoAdminClient, ssoStartURL } =
    await findIdentityStoreStaged({ credentials })
  db.sso.details.identityStoreID = id
  db.sso.details.identityStoreARN = identityStoreARN
  db.sso.details.identityStoreRegion = identityStoreRegion
  db.sso.details.ssoStartURL = ssoStartURL

  return { identityStoreID : id, identityStoreRegion, identityStoreARN, ssoAdminClient }
}

const importPermissionSet = async ({ db, groupName, identityStoreARN, policyName, ssoAdminClient }) => {
  const permissionSetARN = await searchPermissionSets({ identityStoreARN, policyName, ssoAdminClient })
  db.sso.groups[groupName].permissionSetARN = permissionSetARN
}

const importPolicyData = async ({ db, groupName, iamClient, policyName }) => {
  const policyARN = await searchPolicies({ policyName, iamClient })
  db.sso.groups[groupName].policyARN = policyARN
}

export { doImportSSO }
