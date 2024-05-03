import { ListBucketsCommand, GetBucketTaggingCommand, S3Client } from '@aws-sdk/client-s3'

import { progressLogger } from './progress-logger'

const findBucketByTags = async ({ credentials, description, tags }) => {
  progressLogger?.write(`Attempting to find ${description} bucket... `)
  const s3Client = new S3Client({ credentials })
  const listBucketsCommand = new ListBucketsCommand({})
  const { Buckets : buckets } = await s3Client.send(listBucketsCommand)

  for (const { Name: name } of buckets) {
    const getBucketTaggingCommand = new GetBucketTaggingCommand({ Bucket : name })
    const bucketTags = await s3Client.send(getBucketTaggingCommand)

    const foundTags = Array.from(tags, () => false)
    let i = -1
    for (const { key, value } of tags) {
      i += 1
      for (const { Key : bucketKey, Value : bucketValue } of bucketTags.TagSet) {
        if (key === bucketKey && value === bucketValue) {
          foundTags[i] = true
          break
        }
      }
      if (foundTags[i] === false) {
        break
      }
    }

    if (!foundTags.some((found) => found === false)) {
      progressLogger?.write('found: ' + name + '\n')
      return name
    }
  }

  progressLogger?.write('NONE found\n')
  return undefined
}

export { findBucketByTags }
