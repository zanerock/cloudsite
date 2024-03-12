import { v4 as uuidv4 } from 'uuid'

import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

import { convertDomainToBucketName } from './convert-domain-to-bucket-name'

const determineBucketName = async (args) => {
  const { apexDomain, credentials, findName = false, siteInfo } = args
  let { bucketName, s3Client } = args

  if (bucketName === undefined) {
    bucketName = siteInfo.bucketName || convertDomainToBucketName(apexDomain)
  }

  let { accountID } = siteInfo
  if (accountID === undefined) {
    process.stdout.write('Getting effective account ID...\n')
    const response = await new STSClient({ credentials }).send(new GetCallerIdentityCommand({}))
    accountID = response.Account
    siteInfo.accountID = accountID
  }

  s3Client = s3Client || new S3Client({ credentials })

  while (true) {
    process.stdout.write(`Checking bucket '${bucketName}' is free...\n`)

    const input = { Bucket : bucketName, ExpectedBucketOwner : accountID }

    const command = new HeadBucketCommand(input)
    try {
      await s3Client.send(command)
      if (findName !== true) {
        throw new Error(`Account already owns bucket '${bucketName}'; delete or specify alternate bucket name.`)
      }
    } catch (e) {
      if (e.name === 'NotFound') {
        return bucketName
      } else if (findName !== true) {
        throw e
      }
    }
    const bucketSalt = uuidv4().slice(0, 8)
    bucketName = bucketName.replace(/-[A-F0-9]{8}$/i, '')
    bucketName += '-' + bucketSalt
  }
}

export { determineBucketName }
