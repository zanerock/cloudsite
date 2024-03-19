import { ACMClient } from '@aws-sdk/client-acm'
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation'
import { CloudFrontClient } from '@aws-sdk/client-cloudfront'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'

import { getAccountID } from '../shared/get-account-id'
import { getCredentials } from './lib/get-credentials'
import { findCertificate } from './lib/find-certificate'
import { findOACNameByID } from '../shared/find-oac-name-by-id'
import * as plugins from '../../plugins'
import { progressLogger } from '../shared/progress-logger'

const doImport = async ({ commonLogsBucket, domain, globalOptions, region, sourcePath, sourceType, stack }) => {
  const siteInfo = { apexDomain : domain, stackName : stack, region, sourcePath, sourceType }
  const credentials = getCredentials(globalOptions)

  const acmClient = new ACMClient({ credentials, region : 'us-east-1' }) // certificates are always in us-east-1
  const { certificateArn } = await findCertificate({ apexDomain : domain, acmClient })
  siteInfo.certificateArn = certificateArn

  const accountID = await getAccountID({ credentials })
  siteInfo.accountID = accountID

  progressLogger?.write(`Examining stack '${stack}' outputs...\n`)
  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const describeStacksCommand = new DescribeStacksCommand({ StackName : stack })
  const stacksInfo = await cloudFormationClient.send(describeStacksCommand)
  const stackOutputs = stacksInfo.Stacks[0].Outputs || []
  for (const { OutputKey: key, OutputValue: value } of stackOutputs) {
    if (key === 'SiteS3Bucket') {
      siteInfo.bucketName = value

      if (commonLogsBucket === undefined) {
        progressLogger?.write('Attempting to find shared logging bucket... ')
        const s3Client = new S3Client({ credentials })
        const listBucketsCommand = new ListBucketsCommand({})
        const { Buckets : buckets } = await s3Client.send(listBucketsCommand)

        const searchString = value + '-common-logs'
        const possibleMatches = buckets.filter(({ Name : name }) => name.startsWith(searchString))
        
        if (possibleMatches.length === 0) {
          progressLogger?.write('NONE found\n')
        }
        else if (possibleMatches.length === 1) {
          commonLogsBucket = possibleMatches[0].Name
          progressLogger?.write('found: ' + commonLogsBucket + '\n')
          siteInfo.commonLogsBucket = commonLogsBucket
        }
        else { // possible matches greater than one, but commonLogsBucket not set
          // TODO: tailor the message for CLI or library...
          progressLogger?.write('found multiple\n')
          throw new Exception("Found multiple possible 'common logs' buckets; specify which to use with '--common-logs-bucket': " +
              possibleMatches.map(({ Name : name }) => name).join(', '))
        }
      }
    } else if (key === 'SiteCloudFrontDistribution') {
      siteInfo.cloudFrontDistributionID = value
    } else if (key === 'OriginAccessControl') {
      const oacID = value
      const cloudFrontClient = new CloudFrontClient({ credentials, region })
      const oacName = await findOACNameByID({ cloudFrontClient, oacID })
      siteInfo.oacName = oacName
    }
  } // for (... of stackOutputs)

  progressLogger?.write('Loading plugins data...\n')

  const { apexDomain, pluginSettings } = siteInfo

  for (const { importHandler, name } of plugins) {
    if (importHandler === undefined) {
      throw new Error(`Plugin '${name}' does not define 'importHandler'; cannot  continue with import.`)
    }

    await importHandler({ credentials, siteInfo })
  }

  console.log(JSON.stringify(stacksInfo, null, '  '))

  return siteInfo
}

export { doImport }
