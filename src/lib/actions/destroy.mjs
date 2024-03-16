import { S3Client } from '@aws-sdk/client-s3'
import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation'

import { emptyBucket } from 's3-empty-bucket'

import { getCredentials } from './lib/get-credentials'
import { trackStackStatus } from './lib/track-stack-status'

const destroy = async ({ globalOptions, siteInfo, verbose }) => {
  const { bucketName, stackName } = siteInfo

  const credentials = getCredentials(globalOptions)
  const s3Client = new S3Client({ credentials })

  // this method provides user udptaes
  await emptyBucket({ bucketName, s3Client, verbose })

  const siteTemplate = new SiteTemplate({ credentials, siteInfo })
  await siteTemplate.destroyPlugins()

  process.stdout.write('Deleting stack...\n')
  const cloudFormationClient = new CloudFormationClient({ credentials })
  const deleteStackCommand = new DeleteStackCommand({ StackName : stackName })
  await cloudFormationClient.send(deleteStackCommand)
  
  const finalStatus = await trackStackStatus({ cloudFormationClient, noDeleteOnFailure: true, stackName })
  progressLogger?.write('Final status: ' + finalStatus + '\n')
}

export { destroy }
