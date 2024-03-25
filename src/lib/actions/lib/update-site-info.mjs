import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation'

import { progressLogger } from '../../shared/progress-logger'

const updateSiteInfo = async ({ credentials, siteInfo }) => {
  const { region, stackName } = siteInfo
  progressLogger.write('Gathering information from stack...\n')
  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const describeCommand = new DescribeStacksCommand({ StackName : stackName })
  const describeResponse = await cloudFormationClient.send(describeCommand)
  const cloudFrontDistributionID = describeResponse
    .Stacks[0].Outputs.find(({ OutputKey }) => OutputKey === 'SiteCloudFrontDistribution').OutputValue

  siteInfo.cloudFrontDistributionID = cloudFrontDistributionID
}

export { updateSiteInfo }
