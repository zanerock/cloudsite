import { emailRE } from 'regex-repo'
import { emptyBucket } from 's3-empty-bucket'

import { S3Client } from '@aws-sdk/client-s3'

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

const preDestroyHandler = async ({ credentials, progressLogger, settings }) => {
  const { lambdaFunctionsBucket } = settings

  const s3Client = new S3Client({ credentials })

  progressLogger?.write(`Deleting S3 bucket ${lambdaFunctionsBucket}... `)
  await emptyBucket({ bucketName : lambdaFunctionsBucket, doDelete: true, s3Client })
  progressLogger?.write('DELETED\n')
}

const stackConfig = async ({ siteTemplate, settings }) => {
  process.stdout.write('Preparing contact handler plugin...\n')

  const { credentials, siteInfo } = siteTemplate
  const enableEmail = !!settings.emailFrom

  const lambdaFunctionsBucketName = await stageLambdaFunctionZipFiles({ credentials, enableEmail, settings, siteInfo })

  setupContactHandler({ lambdaFunctionsBucketName, siteInfo, siteTemplate })
  setupRequestSigner({ lambdaFunctionsBucketName, siteTemplate })
  setupContactFormTable({ siteInfo, siteTemplate })
  updateCloudFrontDistribution({ settings, siteTemplate })
  if (enableEmail === true) {
    setupContactEmailer({ lambdaFunctionsBucketName, settings, siteTemplate })
  }
}

const contactHandler = { config, preDestroyHandler, stackConfig }

export { contactHandler }
