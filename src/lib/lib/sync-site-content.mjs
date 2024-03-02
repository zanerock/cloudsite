import { existsSync as fileExists } from 'node:fs'
import * as fsPath from 'node:path'

import { S3Client } from '@aws-sdk/client-s3'
import { tryExec } from '@liquid-labs/shell-toolkit'
import mime from 'mime-types'
import { S3SyncClient } from 's3-sync-client'

const syncSiteContent = async ({ credentials, noBuild, siteInfo }) => {
  const { bucketName, sourcePath, sourceType } = siteInfo

  if (noBuild !== true && sourceType === 'docusaurus') {
    const packageRoot = fsPath.resolve(sourcePath, '..')
    const packagePath = fsPath.join(packageRoot, 'package.json')
    if (fileExists) {
      process.stdout.write('Rebuilding site... ')
      tryExec(`cd "${packageRoot}" && npm run build`)
      process.stdout.write('done.\n')
    }
  }

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
