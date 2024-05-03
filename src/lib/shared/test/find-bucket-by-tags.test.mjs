import * as ClientS3 from '@aws-sdk/client-s3'

import { findBucketByTags } from '../find-bucket-by-tags'
import { configureLogger } from '../progress-logger'

jest.mock('@aws-sdk/client-s3')

describe('findBucketByTags', () => {
  beforeAll(() => {
    configureLogger(() => {})
  })

  test.each([
    ['finds tag bucket in set of 1',
      { bucket1 : [{ Key : 'foo', Value : 'bar' }] },
      [{ key : 'foo', value : 'bar' }],
      'bucket1'
    ]
  ])('%s', async (description, buckets, tags, expected) => {
    ClientS3.GetBucketTaggingCommand.mockImplementation((input) => ({ input }))
    ClientS3.S3Client.mockImplementation(() => {
      return {
        send : async (command) => {
          if (command instanceof ClientS3.ListBucketsCommand) {
            return { Buckets : Object.keys(buckets).map((b) => ({ Name : b })) }
          } else { // it's a GetBucketTaggingCommand
            const name = command.input.Bucket
            return { TagSet : buckets[name] }
          }
        }
      }
    })

    expect(await findBucketByTags({ credentials : '', tags })).toBe(expected)
  })
})
