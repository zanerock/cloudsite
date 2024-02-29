import { S3Client } from '@aws-sdk/client-s3'

import mime from 'mime-types'
import { S3SyncClient } from 's3-sync-client'

const syncSiteContent = async ({ credentials, siteInfo }) => {
  const { bucketName, sourcePath } = siteInfo

  process.stdout.write(`Syncing files from ${sourcePath}...\n`)

  const s3Client = new S3Client({ credentials })
  const { sync } = new S3SyncClient({ client : s3Client })

  await sync(sourcePath, 's3://' + bucketName, {
    commandInput           : (input) => ({ ContentType : mime.lookup(input.Key) || 'application/octet-stream' }),
    del                    : true,
    maxConcurrentTransfers : 10
  })
}

export { syncSiteContent }
