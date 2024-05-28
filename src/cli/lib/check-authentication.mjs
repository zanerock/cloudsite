import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'

import { getCredentials } from '../../lib/shared/authentication-lib'

const checkAuthentication = async ({ globalOptions = {} } = {}) => {
  const credentials = getCredentials(globalOptions) // passes in 'sso-profile'

  const s3Client = new S3Client({ credentials })
  const listBucketsCommand = new ListBucketsCommand({})
  await s3Client.send(listBucketsCommand) // we don't actually care about the result, we're just checking the auth
}

export { checkAuthentication }
