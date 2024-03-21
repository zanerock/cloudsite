import yaml from 'js-yaml'

import { ACMClient } from '@aws-sdk/client-acm'
import { CloudFormationClient, DescribeStacksCommand, GetTemplateCommand } from '@aws-sdk/client-cloudformation'

import { getAccountID } from '../shared/get-account-id'
import { getCredentials } from './lib/get-credentials'
import { findBucketLike } from '../shared/find-bucket-like'
import { findCertificate } from './lib/find-certificate'
import * as plugins from '../plugins'
import { progressLogger } from '../shared/progress-logger'

const doImport = async ({ commonLogsBucket, db, domain, region, sourcePath, sourceType, stack }) => {
  const siteInfo = { apexDomain : domain, stackName : stack, region, sourcePath, sourceType }
  const credentials = getCredentials(db.account.settings)

  const acmClient = new ACMClient({ credentials, region : 'us-east-1' }) // certificates are always in us-east-1
  const { certificateArn } = await findCertificate({ apexDomain : domain, acmClient })
  siteInfo.certificateArn = certificateArn

  const accountID = await getAccountID({ credentials })
  siteInfo.accountID = accountID

  progressLogger?.write(`Examining stack '${stack}' outputs...\n`)
  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const describeStacksCommand = new DescribeStacksCommand({ StackName : stack })
  const stacksInfo = await cloudFormationClient.send(describeStacksCommand)

  const getTemplateCommand = new GetTemplateCommand({ StackName : stack })
  const templateBody = (await cloudFormationClient.send(getTemplateCommand)).TemplateBody
  const template = yaml.load(templateBody)

  siteInfo.oacName = template.Resources.SiteCloudFrontOriginAccessControl.Properties.OriginAccessControlConfig.Name

  const stackOutputs = stacksInfo.Stacks[0].Outputs || []
  for (const { OutputKey: key, OutputValue: value } of stackOutputs) {
    if (key === 'SiteS3Bucket') {
      siteInfo.bucketName = value

      if (commonLogsBucket === undefined) {
        commonLogsBucket = await findBucketLike({
          credentials,
          description : 'common logs',
          partialName : value + '-common-logs'
        })
      }
      if (commonLogsBucket !== undefined && commonLogsBucket !== 'NONE') {
        siteInfo.commonLogsBucket = commonLogsBucket
      }
    } else if (key === 'SiteCloudFrontDistribution') {
      siteInfo.cloudFrontDistributionID = value
    }
  } // for (... of stackOutputs)

  progressLogger?.write('Loading plugins data...\n')

  const pluginSettings = {}
  siteInfo.pluginSettings = pluginSettings

  for (const pluginName of Object.keys(plugins)) {
    progressLogger?.write(`Importing plugin settings for '${pluginName}'...\n`)
    const { importHandler } = plugins[pluginName]
    if (importHandler === undefined) {
      throw new Error(`Plugin '${pluginName}' does not define 'importHandler'; cannot  continue with import.`)
    }

    await importHandler({ credentials, name : pluginName, pluginSettings, siteInfo, template })
  }

  return siteInfo
}

export { doImport }
