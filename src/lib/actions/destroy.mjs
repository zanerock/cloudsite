import { S3Client } from '@aws-sdk/client-s3'
import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation'

import { emptyBucket } from 's3-empty-bucket'

import { getCredentials } from './lib/get-credentials'
import * as plugins from '../plugins'

const destroy = async ({ globalOptions, progressLogger, siteInfo }) => {
  const { apexDomain, bucketName, pluginSettings, stackName } = siteInfo

  const credentials = getCredentials(globalOptions)
  const s3Client = new S3Client({ credentials })

  // this method provides user udptaes
  progressLogger?.write(`Deleting S3 bucket ${bucketName}... `)
  await emptyBucket({ bucketName, s3Client })
  progressLogger?.write('DELETED\n')

  for (const [pluginKey, settings] of Object.entries(pluginSettings)) {
    const plugin = plugins[pluginKey]
    if (plugin === undefined) {
      throw new Error(`Unknown plugin found in '${apexDomain}' plugin settings.`)
    }

    if (plugin.preDestroyHandler !== undefined) {
      await plugin.preDestroyHandler({ credentials, progressLogger, settings })
    }
  }

  progressLogger?.write('Deleting stack...\n')
  const cloudFormationClient = new CloudFormationClient({ credentials })
  const deleteStackCommand = new DeleteStackCommand({ StackName : stackName })
  await cloudFormationClient.send(deleteStackCommand)
  progressLogger?.write('Done!\n')
}

export { destroy }
