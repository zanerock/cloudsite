import { findIdentityStoreStaged } from '../../../lib/shared/find-identity-store'
import { getCredentials } from '../../../lib/shared/authentication-lib'

const handler = async ({ db, globalOptions }) => {
  const dbDetails = db.sso.details
  if (dbDetails.identityStoreID !== undefined) {
    return { success : true, data : dbDetails }
  } else { // we'll try and and return the details
    const credentials = getCredentials(globalOptions)

    const findIdentityStoreResults = await findIdentityStoreStaged({ credentials })
    delete findIdentityStoreResults.ssoAdminClient

    db.sso.details = findIdentityStoreResults

    return { success : true, data : findIdentityStoreResults }
  }
}

export { handler }
