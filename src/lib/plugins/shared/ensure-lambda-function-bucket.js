import { CreateBucketCommand, PutBucketTaggingCommand } from '@aws-sdk/client-s3'

import { convertDomainToBucketName } from '../../shared/convert-domain-to-bucket-name'
import { determineBucketName } from '../../shared/determine-bucket-name'
import { getSiteTag } from '../../shared/get-site-tag'
import { progressLogger } from '../../shared/progress-logger'

const ensureLambdaFunctionBucket = async ({ credentials, pluginData, s3Client, siteInfo }) => {
  progressLogger.write('Checking for lambda function bucket bucket... ')

  const { apexDomain } = siteInfo
  let { lambdaFunctionsBucket } = pluginData

  if (lambdaFunctionsBucket === undefined) {
    lambdaFunctionsBucket = convertDomainToBucketName(apexDomain) + '-lambda-functions'
    progressLogger.write('CREATING\n')
    lambdaFunctionsBucket =
      await determineBucketName({
        bucketName : lambdaFunctionsBucket,
        credentials,
        findName   : true,
        s3Client,
        siteInfo
      })

    progressLogger.write(`Determined name '${lambdaFunctionsBucket}'\n`)

    const createBucketCommand = new CreateBucketCommand({
      ACL    : 'private',
      Bucket : lambdaFunctionsBucket
    })
    await s3Client.send(createBucketCommand)
    progressLogger.write('Created.\n')
  } else {
    progressLogger.write(`FOUND ${lambdaFunctionsBucket}\n`)
  }

  const siteTag = getSiteTag(siteInfo)
  const putBucketTaggingCommand = new PutBucketTaggingCommand({
    Bucket  : lambdaFunctionsBucket,
    Tagging : {
      TagSet : [{ Key : siteTag, Value : '' }]
    }
  })
  await s3Client.send(putBucketTaggingCommand)

  pluginData.lambdaFunctionsBucket = lambdaFunctionsBucket

  return lambdaFunctionsBucket
}

export { ensureLambdaFunctionBucket }
