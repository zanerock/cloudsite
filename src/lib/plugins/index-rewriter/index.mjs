import { emptyBucket } from 's3-empty-bucket'

import { S3Client } from '@aws-sdk/client-s3'

import { INCLUDE_PLUGIN_DEFAULT_TRUE, INCLUDE_PLUGIN_DEFAULT_FALSE } from '../../shared/constants'
import { INDEX_REWRITER_ZIP_NAME } from './lib/constants'
import { findBucketByTags } from '../../shared/find-bucket-by-tags'
import { getResourceTags } from '../../shared/get-resource-tags'
import { progressLogger } from '../../shared/progress-logger'
import { setupIndexRewriter } from './lib/setup-index-rewriter'
import { stageLambdaFunctionZipFiles } from '../shared/stage-lambda-function-zip-files'
import { updateCloudFrontDistribution } from './lib/update-cloudfront-distribution'

const config = {
  name          : 'index.html rewriter',
  description   : "Appends 'index.html' to bare directory requests.",
  options       : undefined,
  includePlugin : ({ siteInfo }) => {
    const { sourceType } = siteInfo

    return sourceType === 'vanilla' ? INCLUDE_PLUGIN_DEFAULT_TRUE : INCLUDE_PLUGIN_DEFAULT_FALSE
  }
}

const importHandler = async ({ credentials, name, pluginsData, siteInfo }) => {
  const lambdaFunctionsBucket = await findBucketByTags({
    credentials,
    description : 'Lambda functions',
    tags        : getResourceTags({ funcDesc : 'lambda code storage', siteInfo })
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
const preStackDestroyHandler = async ({ siteTemplate }) => {
  const { credentials } = siteTemplate
  const { lambdaFunctionsBucket } = siteTemplate.siteInfo

  if (lambdaFunctionsBucket !== undefined) {
    progressLogger?.write(`Deleting ${lambdaFunctionsBucket} bucket...`)
    const s3Client = new S3Client({ credentials })
    try {
      await emptyBucket({
        bucketName : lambdaFunctionsBucket,
        doDelete   : true,
        s3Client,
        verbose    : progressLogger !== undefined
      })
      progressLogger?.write('DELETED.\n')
      delete siteTemplate.siteInfo.lambdaFunctionsBucket
    } catch (e) {
      progressLogger?.write('ERROR.\n')
      throw e
    }
  } else {
    progressLogger?.write('Looks like the Lambda function bucket has already been deleted; skipping.\n')
  }
}

const stackConfig = async ({ siteTemplate, pluginData, update }) => {
  progressLogger.write('Preparing index rewriter plugin...\n')

  const { credentials, siteInfo } = siteTemplate

  const lambdaFileNames = [INDEX_REWRITER_ZIP_NAME]

  const lambdaFunctionsBucketName =
    await stageLambdaFunctionZipFiles({ credentials, lambdaFileNames, siteInfo })
  siteInfo.lambdaFunctionsBucketName = lambdaFunctionsBucketName

  await setupIndexRewriter({ credentials, pluginData, siteInfo, siteTemplate, update })
  updateCloudFrontDistribution({ pluginData, siteTemplate })
}

const indexRewriter = { config, importHandler, preStackDestroyHandler, stackConfig }

export { indexRewriter }
