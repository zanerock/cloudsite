import { S3Client } from '@aws-sdk/client-s3'
import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation'

import { emptyBucket } from 's3-empty-bucket'

import { getCredentials } from './lib/get-credentials'
import { progressLogger } from '../shared/progress-logger'
import { SiteTemplate } from '../shared/site-template'
import { trackStackStatus } from './lib/track-stack-status'

const destroy = async ({ db, siteInfo, verbose }) => {
  const { bucketName, stackName } = siteInfo

  const credentials = getCredentials(db.account.settings)
  const s3Client = new S3Client({ credentials })

  // this method provides user udptaes
  try {
    progressLogger?.write('Deleting site bucket...\n')
    await emptyBucket({ bucketName, doDelete : true, s3Client, verbose })
  } catch (e) {
    if (e.name === 'NoSuchBucket') {
      progressLogger?.write('Bucket already deleted.\n')
    } else {
      throw e
    }
  }

  const siteTemplate = new SiteTemplate({ credentials, siteInfo })
  await siteTemplate.destroyPlugins()

  progressLogger.write('Deleting stack...\n')
  const cloudFormationClient = new CloudFormationClient({ credentials })
  const deleteStackCommand = new DeleteStackCommand({ StackName : stackName })
  await cloudFormationClient.send(deleteStackCommand)

  // the delete command is doesn't mind if the bucket doesn't exist, but trackStackStatus does
  try {
    const finalStatus = await trackStackStatus({ cloudFormationClient, noDeleteOnFailure : true, stackName })
    progressLogger?.write('Final status: ' + finalStatus + '\n')

    if (finalStatus === 'DELETE_FAILED') {
      progressLogger?.write('\nThe delete is expected to fail at first because the \'replicated Lambda functions\' take a while to clear and the stack cannot be fully deleted until AWS clears the replicated functions. Give it at least 30 min and up to a few hours and try again.')
      return false
    } else if (finalStatus === 'DELETE_COMPLETE') {
      return true
    }
  } catch (e) {
    // oddly, if the stack does not exist we get a ValidationError; which means it's already deleted
    if (e.name === 'ValidationError') {
      progressLogger.write(' already deleted.\n')
      return true
    } else {
      throw e
    }
  } finally {
    progressLogger?.write('\n')
  }
}

export { destroy }
