import { S3Client } from '@aws-sdk/client-s3'
import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation'

import { emptyBucket } from 's3-empty-bucket'

import { getCredentials } from './lib/get-credentials'

const destroy = async ({ siteInfo, ...downstreamOptions }) => {
  const { bucketName, stackName } = siteInfo

  const credentials = getCredentials(downstreamOptions)
  const s3Client = new S3Client({ credentials })

  // this method provides user udptaes
  await emptyBucket({ bucketName, s3Client })

  process.stdout.write('Deleting stack...\n')
  const cloudFormationClient = new CloudFormationClient({ credentials })
  const deleteStackCommand = new DeleteStackCommand({ StackName : stackName })
  await cloudFormationClient.send(deleteStackCommand)
  process.stdout.write('Done!\n')
}

export { destroy }
