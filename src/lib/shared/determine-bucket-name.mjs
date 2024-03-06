import { v4 as uuidv4 } from 'uuid'

import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

import { convertDomainToBucketName } from './convert-domain-to-bucket-name'

const determineBucketName = async (args) => {
  let { bucketName } = args
  const { credentials, findName = false, siteInfo } = args

  process.stdout.write('Getting effective account ID...\n')
  const response = await new STSClient({ credentials }).send(new GetCallerIdentityCommand({}))
  const accountID = response.Account
  siteInfo.accountID = accountID

  if (bucketName === undefined) {
    bucketName = siteInfo.bucketName || convertDomainToBucketName(siteInfo.apexDomain)
  }
  // else, we use the explicit bucketName provided
  process.stdout.write(`Checking bucket '${bucketName}' is free...\n`)

  const s3Client = new S3Client({ credentials })
  const input = { Bucket : bucketName, ExpectedBucketOwner : accountID }

  const command = new HeadBucketCommand(input)
  try {
    await s3Client.send(command)
    if (findName === true) {
      nextName(args)
    } else {
      throw new Error(`Account already owns bucket '${bucketName}'; delete or specify alternate bucket name.`)
    }
  } catch (e) {
    if (e.name === 'NotFound') {
      return bucketName
    } else if (findName === true) {
      nextName(args)
    } else {
      throw e
    }
  }
}

const nextName = (args) => {
  let { bucketName } = args

  const bucketSalt = uuidv4().slice(0, 8)
  bucketName.replace(/-[A-F0-9]{8}$/, '')
  bucketName += bucketSalt

  determineBucketName({ ...args, bucketName })
}

export { determineBucketName }
