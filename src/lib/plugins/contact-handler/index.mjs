import { emailRE } from 'regex-repo'
import { emptyBucket } from 's3-empty-bucket'

import { PutBucketTaggingCommand, S3Client } from '@aws-sdk/client-s3'

import { getSiteTag } from '../../shared/get-site-tag'
import { progressLogger } from '../../shared/progress-logger'
import { setupContactFormTable } from './lib/setup-contact-form-table'
import { setupContactEmailer } from './lib/setup-contact-emailer'
import { setupContactHandler } from './lib/setup-contact-handler'
import { setupRequestSigner } from './lib/setup-request-signer'
import { stageLambdaFunctionZipFiles } from './lib/stage-lambda-function-zip-files'
import { updateCloudFrontDistribution } from './lib/update-cloud-front-distribution'

const config = {
  options : {
    email : {
      matches : emailRE
    },
    urlPath : {
      default : '/contact-handler',
      matches : /^\/(?:[a-z0-9_-]+\/?)+$/
    }
  }
}

const preStackDestroyHandler = async ({ settings, siteTemplate }) => {
  const { credentials } = siteTemplate
  const { lambdaFunctionsBucket } = settings

  progressLogger?.write(`Deleting ${lambdaFunctionsBucket} bucket...\n`)
  const s3Client = new S3Client({ credentials })
  await emptyBucket({
    bucketName : lambdaFunctionsBucket,
    doDelete   : true,
    s3Client,
    verbose    : progressLogger !== undefined
  })
  delete settings.lambdaFunctionsBucket
}

const stackConfig = async ({ siteTemplate, settings }) => {
  process.stdout.write('Preparing contact handler plugin...\n')

  const { credentials, siteInfo } = siteTemplate
  const enableEmail = !!settings.emailFrom

  const lambdaFunctionsBucketName = await stageLambdaFunctionZipFiles({ credentials, enableEmail, settings, siteInfo })

  await setupContactHandler({ credentials, lambdaFunctionsBucketName, settings, siteInfo, siteTemplate })
  await setupRequestSigner({ credentials, lambdaFunctionsBucketName, settings, siteTemplate })
  setupContactFormTable({ siteInfo, siteTemplate })
  updateCloudFrontDistribution({ settings, siteTemplate })
  if (enableEmail === true) {
    await setupContactEmailer({ credentials, lambdaFunctionsBucketName, settings, siteTemplate })
  }
}

const updateHandler = async ({ credentials, settings, siteInfo }) => {
  const { lambdaFunctionsBucket } = settings
  const siteTag = getSiteTag(siteInfo)

  const s3Client = new S3Client({ credentials })
  const putBucketTaggingCommand = new PutBucketTaggingCommand({
    Bucket  : lambdaFunctionsBucket,
    Tagging : {
      TagSet : [{ Key : siteTag, Value : '' }]
    }
  })
  await s3Client.send(putBucketTaggingCommand)
}

const contactHandler = { config, preStackDestroyHandler, stackConfig, updateHandler }

export { contactHandler }
