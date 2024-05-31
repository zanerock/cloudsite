import { IAMClient } from '@aws-sdk/client-iam'
import { IdentitystoreClient } from '@aws-sdk/client-identitystore'

import { findIdentityStoreStaged } from '../shared/find-identity-store'
import { searchGroups } from './lib/search-groups'
import { searchPermissionSets } from './lib/search-permission-sets'
import { searchPolicies } from './lib/search-policies'

const doImportAccount = async ({ credentials, db, groupName, policyName }) => {
  const { identityStoreID, identityStoreRegion, instanceARN, ssoAdminClient } =
    await importIdentityStoreData({ credentials, db })
  const iamClient = new IAMClient({ credentials })

  Promise.all([
    await importGroupData({ credentials, db, groupName, identityStoreID, identityStoreRegion }),
    await importPermissionSet({ db, instanceARN, policyName, ssoAdminClient }),
    await importPolicyData({ db, iamClient, policyName })
  ])
}

const importGroupData = async ({ credentials, db, groupName, identityStoreID, identityStoreRegion }) => {
  if (groupName !== undefined && (db.account.groupName !== groupName || db.account.groupID === undefined)) {
    db.account.groupName = groupName
    const identityStoreClient = new IdentitystoreClient({ credentials, region : identityStoreRegion })
    const groupID = await searchGroups({ groupName : db.account.groupName, identityStoreClient, identityStoreID })
    db.account.groupID = groupID
  } else if (db.account.groupName === undefined || db.account.groupID === undefined) {
    throw new Error('No group name and/or ID defined in local DB; must provide group name to resolve.')
  }
}

const importIdentityStoreData = async ({ credentials, db }) => {
  const { id, instanceARN, region, ssoAdminClient, ssoStartURL } = await findIdentityStoreStaged({ credentials })
  db.permissions.sso.identityStoreID = id
  db.permissions.sso.identityStoreARN = instanceARN
  db.permissions.sso.identityStoreRegion = region
  db.permissions.sso.ssoStartURL = ssoStartURL

  return { identityStoreID : id, identityStoreRegion : region, instanceARN, ssoAdminClient }
}

const importPermissionSet = async ({ db, instanceARN, policyName, ssoAdminClient }) => {
  const permissionSetARN = await searchPermissionSets({ instanceARN, policyName, ssoAdminClient })
  db.account.permissionSetARN = permissionSetARN
}

const importPolicyData = async ({ db, iamClient, policyName }) => {
  if (policyName !== undefined) {
    const policyARN = await searchPolicies({ policyName, iamClient })
    db.account.policyName = policyName
    db.account.policyARN = policyARN
  } else if (db.account.policyName === undefined || db.account.policyID === undefined) {
    throw new Error('No policy name and/or ARN defined in local DB; must provide policy name to resolve.')
  }
}

export { doImportAccount }
