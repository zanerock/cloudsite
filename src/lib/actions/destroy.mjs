import { S3Client } from '@aws-sdk/client-s3'
import { CloudFormationClient, DeleteStackCommand } from '@aws-sdk/client-cloudformation'

import { emptyBucket } from 's3-empty-bucket'

import { getCredentials } from './lib/get-credentials'
import { progressLogger } from '../shared/progress-logger'
import { SiteTemplate } from '../shared/site-template'
import { trackStackStatus } from './lib/track-stack-status'

const destroy = async ({ db, siteInfo, verbose }) => {
  const { apexDomain, siteBucketName, stackName } = siteInfo

  const credentials = getCredentials(db.account.localSettings)
  const s3Client = new S3Client({ credentials })

  // this method provides user udptaes
  try {
    if (verbose === true) { progressLogger?.write('Deleting site bucket...\n') }
    await emptyBucket({ bucketName : siteBucketName, doDelete : true, s3Client, verbose })
  } catch (e) {
    if (e.name === 'NoSuchBucket') {
      if (verbose === true) { progressLogger?.write('Bucket already deleted.\n') }
    } else {
      throw e
    }
  }

  const siteTemplate = new SiteTemplate({ credentials, siteInfo })
  await siteTemplate.destroyPlugins()

  if (verbose === true) { progressLogger.write(`Deleting stack for ${apexDomain}`) }
  const cloudFormationClient = new CloudFormationClient({ credentials })
  const deleteStackCommand = new DeleteStackCommand({ StackName : stackName })
  await cloudFormationClient.send(deleteStackCommand)

  // the delete command is doesn't mind if the bucket doesn't exist, but trackStackStatus does
  try {
    const finalStatus =
      await trackStackStatus({ cloudFormationClient, noDeleteOnFailure : true, noInitialStatus : true, stackName })
    progressLogger.write('\n')

    if (finalStatus === 'DELETE_FAILED') {
      return false
    } else if (finalStatus === 'DELETE_COMPLETE') { // actually, we should never see this, see note below
      return true
    } else {
      throw new Error(`Unexpected final status after delete: ${finalStatus}`)
    }
  } catch (e) {
    // if the stack does not exist we get a ValidationError; so this is the expected outcome when deleting a stack as
    // the last call for update will result in a validation error.
    if (e.name === 'ValidationError') {
      return true
    } else {
      throw e
    }
  } finally {
    if (verbose === true) { progressLogger?.write('\n') }
  }
}

export { destroy }
