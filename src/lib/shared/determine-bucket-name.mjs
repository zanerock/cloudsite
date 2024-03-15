import { v4 as uuidv4 } from 'uuid'

import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

import { convertDomainToBucketName } from './convert-domain-to-bucket-name'
import { progressLogger } from './progress-logger'

const determineBucketName = async (args) => {
  const { apexDomain, credentials, findName = false, siteInfo } = args
  let { bucketName, s3Client } = args

  if (bucketName === undefined) {
    bucketName = siteInfo.bucketName || convertDomainToBucketName(apexDomain)
  }

  let { accountID } = siteInfo
  if (accountID === undefined) {
    progressLogger.write('Getting effective account ID...\n')
    const response = await new STSClient({ credentials }).send(new GetCallerIdentityCommand({}))
    accountID = response.Account
    siteInfo.accountID = accountID
  }

  s3Client = s3Client || new S3Client({ credentials })

  while (true) {
    progressLogger.write(`Checking bucket '${bucketName}' is free... `)

    const input = { Bucket : bucketName, ExpectedBucketOwner : accountID }

    const command = new HeadBucketCommand(input)
    try {
      await s3Client.send(command)
      if (findName !== true) {
        throw new Error(`Account already owns bucket '${bucketName}'; delete or specify alternate bucket name.`)
      }
    } catch (e) {
      if (e.name === 'NotFound') {
        progressLogger.write('FREE\n')
        return bucketName
      } else if (findName !== true || e.name === 'CredentialsProviderError') {
        progressLogger.write('\n')
        throw e
      }
    }
    progressLogger.write('NOT free\n')
    const bucketSalt = uuidv4().slice(0, 8)
    bucketName = bucketName.replace(/-[A-F0-9]{8}$/i, '')
    bucketName += '-' + bucketSalt
  }
}

export { determineBucketName }
