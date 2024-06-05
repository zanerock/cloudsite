import { IAMClient } from '@aws-sdk/client-iam'
import { IdentitystoreClient } from '@aws-sdk/client-identitystore'

import { findIdentityStoreStaged } from '../shared/find-identity-store'
import { searchGroups } from './lib/search-groups'
import { searchPermissionSets } from './lib/search-permission-sets'
import { searchPolicies } from './lib/search-policies'

const doImportAccount = async ({ credentials, db, groupName, policyName }) => {
  const { identityStoreID, identityStoreRegion, identityStoreARN, ssoAdminClient } =
    await importIdentityStoreData({ credentials, db })
  const iamClient = new IAMClient({ credentials })

  Promise.all([
    await importGroupData({ credentials, db, groupName, identityStoreID, identityStoreRegion }),
    await importPermissionSet({ db, identityStoreARN, policyName, ssoAdminClient }),
    await importPolicyData({ db, iamClient, policyName })
  ])
}

const importGroupData = async ({ credentials, db, groupName, identityStoreID, identityStoreRegion }) => {
  if (groupName !== undefined && (db.account.groupName !== groupName || db.account.groupID === undefined)) {
    db.account.groupName = groupName
    const identityStoreClient = new IdentitystoreClient({ credentials, identityStoreRegion })
    const groupID = await searchGroups({ groupName : db.account.groupName, identityStoreClient, identityStoreID })
    db.account.groupID = groupID
  } else if (db.account.groupName === undefined || db.account.groupID === undefined) {
    throw new Error('No group name and/or ID defined in local DB; must provide group name to resolve.')
  }
}

const importIdentityStoreData = async ({ credentials, db }) => {
  const { id, identityStoreARN, identityStoreRegion, ssoAdminClient, ssoStartURL } =
    await findIdentityStoreStaged({ credentials })
  db.permissions.sso.identityStoreID = id
  db.permissions.sso.identityStoreARN = identityStoreARN
  db.permissions.sso.identityStoreRegion = identityStoreRegion
  db.permissions.sso.ssoStartURL = ssoStartURL

  return { identityStoreID : id, identityStoreRegion, identityStoreARN, ssoAdminClient }
}

const importPermissionSet = async ({ db, identityStoreARN, policyName, ssoAdminClient }) => {
  const permissionSetARN = await searchPermissionSets({ identityStoreARN, policyName, ssoAdminClient })
  db.permissions.policies[policyName].permissionSetARN = permissionSetARN
}

const importPolicyData = async ({ db, iamClient, policyName }) => {
  const policyARN = await searchPolicies({ policyName, iamClient })
  db.permissions.policies[policyName].policyARN = policyARN
}

export { doImportAccount }
