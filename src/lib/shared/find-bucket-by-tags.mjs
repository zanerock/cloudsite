import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3'

import { progressLogger } from './progress-logger'

const findBucketLike = async ({ credentials, description, partialName }) => {
  progressLogger?.write(`Attempting to find ${description} bucket... `)
  const s3Client = new S3Client({ credentials })
  const listBucketsCommand = new ListBucketsCommand({})
  const { Buckets : buckets } = await s3Client.send(listBucketsCommand)

  const possibleMatches = buckets.filter(({ Name : name }) => name.startsWith(partialName))

  if (possibleMatches.length === 0) {
    progressLogger?.write('NONE found\n')
  } else if (possibleMatches.length === 1) {
    const commonLogsBucket = possibleMatches[0].Name
    progressLogger?.write('found: ' + commonLogsBucket + '\n')
    return commonLogsBucket
  } else { // possible matches greater than one, but commonLogsBucket not set
    // TODO: tailor the message for CLI or library...
    progressLogger?.write('found multiple\n')
    throw new Error("Found multiple possible 'common logs' buckets; specify which to use with '--common-logs-bucket': " +
        possibleMatches.map(({ Name : name }) => name).join(', '))
  }
}

export { findBucketLike }
