import { emailRE } from 'regex-repo'
import { emptyBucket } from 's3-empty-bucket'

import { S3Client } from '@aws-sdk/client-s3'

import { convertDomainToBucketName } from '../../shared/convert-domain-to-bucket-name'
import { findBucketLike } from '../../shared/find-bucket-like'
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

const importHandler = async ({ credentials, name, pluginSettings, siteInfo, template }) => {
  const cacheBehaviors =
    template.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors || []
  const contactHandlingCacheBehavaiors = cacheBehaviors.filter((cb) =>
    cb.TargetOriginId === 'ContactHandlerLambdaOrigin')

  if (contactHandlingCacheBehavaiors.length > 1) {
    throw new Error("Unexpected template has multiple cache behaviors targeting 'ContactHandlerLambdaOrigin'; cannot proceed with import.")
  } else if (contactHandlingCacheBehavaiors.length === 1) { // then we are enabled
    const contactHandlingCacheBehavaior = contactHandlingCacheBehavaiors[0]
    const emailFrom =
      template.Resources.ContactEmailerFunction.Properties.Environment.Variables.EMAIL_HANDLER_SOURCE_EMAIL
    const emailTo =
      template.Resources.ContactEmailerFunction.Properties.Environment.Variables.EMAIL_HANDLER_TARGET_EMAIL
    const emailerFunctionName = template.Resources.ContactEmailerFunction.Properties.FunctionName
    const requestSignerFunctionName = template.Resources.ContactEmailerFunction.Properties.FunctionName
    const baseBucketName = convertDomainToBucketName(siteInfo.apexDomain)
    const lambdaFunctionsBucket = await findBucketLike({
      credentials,
      description : 'Lambda functions',
      partialName : baseBucketName + '-lambda-functions'
    })
    if (lambdaFunctionsBucket === undefined) {
      throw new Error(`Could not resolve the Lambda function bucket for the '${name}' plugin.`)
    }

    pluginSettings[name] = {
      path : contactHandlingCacheBehavaior.PathPattern,
      emailFrom,
      emailTo,
      emailerFunctionName,
      requestSignerFunctionName,
      lambdaFunctionsBucket
    }
    // we add 'emailTo' in order to keep in next to 'emailFrom', but if it's not defined, we don't want it
    if (emailTo === undefined) {
      delete pluginSettings[name].emailTo
    }
  }
  // else, not enabled, nothing to do
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

  await setupContactHandler({ credentials, lambdaFunctionsBucketName, siteInfo, siteTemplate })
  await setupRequestSigner({ credentials, lambdaFunctionsBucketName, siteTemplate })
  setupContactFormTable({ siteInfo, siteTemplate })
  updateCloudFrontDistribution({ settings, siteTemplate })
  if (enableEmail === true) {
    await setupContactEmailer({ credentials, lambdaFunctionsBucketName, settings, siteTemplate })
  }
}

const contactHandler = { config, importHandler, preStackDestroyHandler, stackConfig }

export { contactHandler }
