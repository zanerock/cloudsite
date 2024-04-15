import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'

import { getCredentials } from '../../lib/actions/lib/get-credentials' // move to shared

const checkAuthentication = async ({ db } = {}) => {
  const credentials = getCredentials(db?.account?.settings) // passes in 'sso-profile'

  const s3Client = new S3Client({ credentials })
  const listBucketsCommand = new ListBucketsCommand({})
  await s3Client.send(listBucketsCommand) // we don't actually care about the result, we're just checking the auth
}

export { checkAuthentication }
