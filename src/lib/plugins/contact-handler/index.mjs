import { emailRE } from 'regex-repo'
import { emptyBucket } from 's3-empty-bucket'

import { S3Client } from '@aws-sdk/client-s3'

import { CONTACT_EMAILER_ZIP_NAME, CONTACT_HANDLER_ZIP_NAME, REQUEST_SIGNER_ZIP_NAME } from './lib/constants'
import { findBucketByTags } from '../../shared/find-bucket-by-tags'
import { getSiteTag } from '../../shared/get-site-tag'
import { progressLogger } from '../../shared/progress-logger'
import { setupContactFormTable } from './lib/setup-contact-form-table'
import { setupContactEmailer } from './lib/setup-contact-emailer'
import { setupContactHandler } from './lib/setup-contact-handler'
import { setupRequestSigner } from './lib/setup-request-signer'
import { stageLambdaFunctionZipFiles } from '../shared/stage-lambda-function-zip-files'
import { updateCloudFrontDistribution } from './lib/update-cloud-front-distribution'

const config = {
  name        : 'Contact handler',
  description : 'Enables contact form processing. Specifically, enters form data and optionally sends an email notification.',
  options     : {
    emailFrom : {
      description    : 'This is the email which will appear as the sender. This address must be configured with SES.',
      required       : true,
      matches        : emailRE,
      invalidMessage : 'Must be a valid email.'
    },
    emailTo : {
      description    : "The optional 'to' email. If left blank, then the 'from' email will be used as both the 'to' and 'from'.",
      matches        : emailRE,
      invalidMessage : 'Must be a valid email.'
    },
    formFields : {
      description : "May be either a JSON specification of fields to process in from the contact form or the string 'standard'. Unless you are adapting an existing form, setting the value to 'standard' should be sufficient in most cases.",
      default     : 'standard',
      validation  : (value) => {
        if (value.match(/\s*standard\s*/i)) {
          return true
        } // else
        let json
        if (typeof value === 'string') {
          try {
            json = JSON.parse(value)
          } catch (e) {
            return false
          }
        } else if (typeof value === 'object') {
          json = value
        } else {
          return false
        }
        for (const type of Object.values(json)) {
          if (type !== 'S' && type !== 'SS') {
            return false
          }
        }
        return true
      },
      invalidMessage : "May be either 'standard' or a valid JSON fields specification."
    },
    urlPath : {
      description : 'The URL path to which to direct form submissions.',
      required    : true,
      default     : '/contact-handler',
      matches     : /^\/(?:[a-z0-9_-]+\/?)+$/
    }
  }
}

const importHandler = async ({ credentials, name, pluginsData, siteInfo, template }) => {
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
    const contactHandlerFunctionName = template.Resources.ContactHandlerLambdaFunction.Properties.FunctionName
    const emailerFunctionName = template.Resources.ContactEmailerFunction.Properties.FunctionName
    const requestSignerFunctionName = template.Resources.SignRequestFunction.Properties.FunctionName
    const lambdaFunctionsBucket = await findBucketByTags({
      credentials,
      description : 'Lambda functions',
      tags        : [
        { key : getSiteTag(siteInfo), value : '' },
        { key : 'function', value : 'lambda code storage' }
      ]
    })
    if (lambdaFunctionsBucket === undefined) {
      throw new Error(`Could not resolve the Lambda function bucket for the '${name}' plugin.`)
    }

    pluginsData[name] = {
      settings : {
        urlPath : contactHandlingCacheBehavaior.PathPattern,
        emailFrom,
        emailTo
      },
      contactHandlerFunctionName,
      emailerFunctionName,
      requestSignerFunctionName,
      lambdaFunctionsBucket
    }
    // we add 'emailTo' in order to keep in next to 'emailFrom', but if it's not defined, we don't want it
    if (emailTo === undefined) {
      delete pluginsData[name].settings.emailTo
    }
  }
  // else, not enabled, nothing to do
}

const preStackDestroyHandler = async ({ siteTemplate }) => {
  const { credentials } = siteTemplate
  const { lambdaFunctionsBucket } = siteTemplate.siteInfo

  if (lambdaFunctionsBucket !== undefined) {
    progressLogger?.write(`Deleting  shared Lambda function bucket ${lambdaFunctionsBucket} bucket...`)
    const s3Client = new S3Client({ credentials })
    try {
      await emptyBucket({
        bucketName : lambdaFunctionsBucket,
        doDelete   : true,
        s3Client,
        verbose    : progressLogger !== undefined
      })
      delete siteTemplate.siteInfo.lambdaFunctionsBucket
      progressLogger?.write('DELETED.\n')
    } catch (e) {
      progressLogger?.write('ERROR.\n')
      throw e
    }
  } else {
    progressLogger?.write('Looks like the Lambda function bucket has already been deleted; skipping.\n')
  }
}

const stackConfig = async ({ pluginData, siteTemplate, update }) => {
  progressLogger.write('Preparing contact handler plugin...\n')

  const { credentials, siteInfo } = siteTemplate
  const enableEmail = !!pluginData.settings.emailFrom

  const lambdaFileNames = [CONTACT_HANDLER_ZIP_NAME, REQUEST_SIGNER_ZIP_NAME]
  if (enableEmail === true) {
    lambdaFileNames.push(CONTACT_EMAILER_ZIP_NAME)
  }

  const lambdaFunctionsBucketName =
    await stageLambdaFunctionZipFiles({ credentials, lambdaFileNames, siteInfo })

  await setupContactHandler({ credentials, lambdaFunctionsBucketName, pluginData, siteInfo, siteTemplate, update })
  await setupRequestSigner({ credentials, lambdaFunctionsBucketName, pluginData, siteTemplate, update })
  setupContactFormTable({ siteInfo, siteTemplate })
  updateCloudFrontDistribution({ pluginData, siteTemplate })
  if (enableEmail === true) {
    await setupContactEmailer({ credentials, lambdaFunctionsBucketName, pluginData, siteTemplate, update })
  }
}

const contactHandler = { config, importHandler, preStackDestroyHandler, stackConfig }

export { contactHandler }
