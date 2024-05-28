import { IdentitystoreClient, ListUsersCommand } from "@aws-sdk/client-identitystore"
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'
import { fromIni } from '@aws-sdk/credential-providers'

const checkAuthentication = async ({ globalOptions = {} } = {}) => {
  const credentials = getCredentials(globalOptions) // passes in 'sso-profile'

  const s3Client = new S3Client({ credentials })
  const listBucketsCommand = new ListBucketsCommand({})
  await s3Client.send(listBucketsCommand) // we don't actually care about the result, we're just checking the auth

  return credentials
}

const checkAdminAuthentication = async ({ credentials, db } = {}) => {
  const identitystoreClient = new IdentitystoreClient({ credentials, region: db.account.identityStoreRegion })
  const listUsersCommand = new ListUsersCommand({ IdentityStoreId: db.account.identityStoreID})
  // we don't actually care about the result, we're just checking the auth
  await identitystoreClient.send(listUsersCommand)

  return credentials
}

const getCredentials = ({ 'sso-profile': ssoProfile } = {}) => {
  ssoProfile = ssoProfile || process.env.AWS_PROFILE || 'default'

  const credentials = fromIni({ profile : ssoProfile })

  return credentials
}

export { checkAuthentication, checkAdminAuthentication, getCredentials }
