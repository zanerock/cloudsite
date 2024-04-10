import { emptyBucket } from 's3-empty-bucket'

import { S3Client } from '@aws-sdk/client-s3'

import { INDEX_REWRITER_ZIP_NAME } from './lib/constants'
import { convertDomainToBucketName } from '../../shared/convert-domain-to-bucket-name'
import { findBucketLike } from '../../shared/find-bucket-like'
import { progressLogger } from '../../shared/progress-logger'
import { setupIndexRewriter } from './lib/setup-index-rewriter'
import { stageLambdaFunctionZipFiles } from '../shared/stage-lambda-function-zip-files'
import { updateCloudFrontDistribution } from './lib/update-cloudfront-distribution'

const config = {
  name        : 'index.html rewriter',
  description : "Appends 'index.html' to bare directory requests.",
  options     : {}
}

const importHandler = async ({ credentials, name, pluginsData, siteInfo }) => {
  const baseBucketName = convertDomainToBucketName(siteInfo.apexDomain)
  const lambdaFunctionsBucket = await findBucketLike({
    credentials,
    description : 'Lambda functions',
    partialName : baseBucketName + '-lambda-functions'
  })
  if (lambdaFunctionsBucket === undefined) {
    throw new Error(`Could not resolve the Lambda function bucket for the '${name}' plugin.`)
  }

  pluginsData[name] = {
    settings : {},
    lambdaFunctionsBucket
  }
}

// TODO: this is copied from contact-handler/index.html; again, this is because the nature of lambda functions, but we
// should have a build step that rolls up the code so we can share
const preStackDestroyHandler = async ({ pluginData, siteTemplate }) => {
  const { credentials } = siteTemplate
  const { lambdaFunctionsBucket } = pluginData

  if (lambdaFunctionsBucket !== undefined) {
    progressLogger?.write(`Deleting ${lambdaFunctionsBucket} bucket...\n`)
    const s3Client = new S3Client({ credentials })
    await emptyBucket({
      bucketName : lambdaFunctionsBucket,
      doDelete   : true,
      s3Client,
      verbose    : progressLogger !== undefined
    })
    delete pluginData.lambdaFunctionsBucket
  } else {
    progressLogger?.write('Looks like the Lambda function bucket has already been deleted; skipping.\n')
  }
}

const stackConfig = async ({ siteTemplate, pluginData, update }) => {
  progressLogger.write('Preparing index rewriter plugin...\n')

  const { credentials, siteInfo } = siteTemplate

  const lambdaFileNames = [INDEX_REWRITER_ZIP_NAME]

  const lambdaFunctionsBucketName =
    await stageLambdaFunctionZipFiles({ credentials, lambdaFileNames, pluginData, siteInfo })

  await setupIndexRewriter({ credentials, lambdaFunctionsBucketName, pluginData, siteInfo, siteTemplate, update })
  updateCloudFrontDistribution({ pluginData, siteTemplate })
}

const indexRewriter = { config, importHandler, preStackDestroyHandler, stackConfig }

export { indexRewriter }
