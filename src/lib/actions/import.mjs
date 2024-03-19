import { ACMClient } from '@aws-sdk/client-acm'
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation'

import { getCredentials } from './lib/get-credentials'
import { findCertificate } from './lib/find-certificate'

const doImport = async ({ domain, globalOptions, region, stack }) => {
  const dbEntry = { apexDomain : domain, stackName: stack, region }
  const credentials = getCredentials(globalOptions)

  const acmClient = new ACMClient({ credentials, region : 'us-east-1' }) // certificates are always in us-east-1
  const { certificateArn } = await findCertificate({ apexDomain : domain, acmClient })
  dbEntry.certificateArn = certificateArn

  const cloudFormationClient = new CloudFormationClient({ credentials, region })

  const describeStacksCommand = new DescribeStacksCommand({ StackName : stack })
  const stacksInfo = await cloudFormationClient.send(describeStacksCommand)
  const stackOutputs = stacksInfo.Stacks[0].Outputs || []
  for (const { OutputKey: key, OutputValue: value } of stackOutputs) {
    if (key === 'SiteS3Bucket') {
      dbEntry.bucketName = value
    }
  }
  console.log(JSON.stringify(stacksInfo, null, '  '))

  return dbEntry
}

export { doImport }
