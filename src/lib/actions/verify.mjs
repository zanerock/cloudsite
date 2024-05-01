import {
  CloudFormationClient,
  DescribeStackDriftDetectionStatusCommand,
  DetectStackDriftCommand
} from '@aws-sdk/client-cloudformation'
import { S3Client } from '@aws-sdk/client-s3'
import { S3SyncClient } from 's3-sync-client'

import { getCredentials } from './lib/get-credentials'
import { progressLogger } from '../shared/progress-logger'

const RECHECK_WAIT_TIME = 2000 // ms

const verify = async ({ checkContent, checkSiteUp, checkStack, db, siteInfo }) => {
  const checkAll = checkContent === undefined && checkSiteUp === undefined && checkStack === undefined
  let credentials
  if (checkAll || checkContent || checkStack) {
    credentials = getCredentials(db.account.localSettings)
  }

  const checks = []
  if (checkAll || checkSiteUp) {
    checks.push(doCheckSiteUp({ progressLogger, siteInfo }))
  }
  if (checkAll || checkContent) {
    checks.push(doCheckContent({ credentials, progressLogger, siteInfo }))
  }
  if (checkAll || checkStack) {
    checks.push(doCheckStack({ credentials, progressLogger, siteInfo }))
  }

  const results = await Promise.all(checks)

  return results.reduce((acc, array) => { acc.push(...array); return acc }, [])
}

const doCheckContent = async ({ credentials, progressLogger, siteInfo }) => {
  if (progressLogger !== undefined) {
    progressLogger.write('Checking site content in sync...\n')
  }
  const { bucketName, sourcePath } = siteInfo

  const s3Client = new S3Client({ credentials })
  const { sync } = new S3SyncClient({ client : s3Client })

  const checkResult = { check : 'S3 bucket and local source in sync' }
  try {
    const objectData = await sync(sourcePath, 's3://' + bucketName, { dryRun : true })

    const createdCount = objectData.created.length
    const updatedCount = objectData.updated.length
    const deletedCount = objectData.deleted.length
    const inSync = (createdCount + updatedCount + deletedCount) === 0
    if (inSync === true) {
      checkResult.status = 'success'
      checkResult.message = 'S3 bucket and local source are up-to-date'
    } else {
      checkResult.status = 'failed'
      checkResult.message =
        `${createdCount} files to create, ${updatedCount} files to update, and ${deletedCount} files to delete`
    }

    return [checkResult]
  } catch (e) {
    checkResult.status = 'error'
    checkResult.message = e.message

    return [checkResult]
  } finally {
    if (progressLogger !== undefined) {
      progressLogger.write('Site content check complete.\n')
    }
  }
}

const doCheckSiteUp = async ({ progressLogger, siteInfo }) => {
  if (progressLogger !== undefined) {
    progressLogger.write('Checking site is up...\n')
  }
  const { apexDomain } = siteInfo

  try {
    const fetchResponses = await Promise.all([
      fetch('https://' + apexDomain),
      fetch('https://www.' + apexDomain)
    ])

    const results = [
      processFetchResults({ domain : apexDomain, fetchResponse : fetchResponses[0] }),
      processFetchResults({ domain : 'www.' + apexDomain, fetchResponse : fetchResponses[1] })
    ]

    return results
  } catch (e) {
    return [
      { check : `site ${apexDomain} is up`, status : 'error', message : e.message },
      { check : `site www.${apexDomain} is up`, status : 'error', message : e.message }
    ]
  } finally {
    if (progressLogger !== undefined) {
      progressLogger.write('Site is up check complete.\n')
    }
  }
}

const doCheckStack = async ({ credentials, progressLogger, siteInfo }) => {
  if (progressLogger !== undefined) {
    progressLogger.write('Checking stack drift status...\n')
  }

  const checkResult = { check : 'Stack drift check' }

  try {
    const { stackName } = siteInfo
    const cfClient = new CloudFormationClient({ credentials })
    const detectDriftCommand = new DetectStackDriftCommand({ StackName : stackName })
    const stackDriftOperationID = (await cfClient.send(detectDriftCommand)).StackDriftDetectionId

    const describeStackDriftDetectionCommand = new DescribeStackDriftDetectionStatusCommand({
      StackDriftDetectionId : stackDriftOperationID
    })
    let stackDriftDescribeResponse
    let detectionStatus
    do {
      if (progressLogger !== undefined) {
        progressLogger.write('.')
      }
      await new Promise(resolve => setTimeout(resolve, RECHECK_WAIT_TIME))

      stackDriftDescribeResponse = await cfClient.send(describeStackDriftDetectionCommand)
      detectionStatus = stackDriftDescribeResponse.DetectionStatus
    } while (detectionStatus === 'DETECTION_IN_PROGRESS')

    const stackDriftStatus = stackDriftDescribeResponse.StackDriftStatus
    if (detectionStatus === 'DETECTION_FAILED') {
      checkResult.status = 'error'
      checkResult.message = (stackDriftStatus === 'IN_SYNC'
        ? 'Stack as checked in sync, but: '
        : 'Stack not in sync and: ') +
        stackDriftDescribeResponse.DetectionStatusReason
    } else if (stackDriftStatus === 'IN_SYNC') {
      checkResult.status = 'success'
      checkResult.message = stackName + ' is in sync with template'
    } else if (stackDriftStatus === 'UNKNOWN') {
      checkResult.status = 'error'
      checkResult.message = stackName + ' drift status is unknown'
    } else if (stackDriftStatus === 'DRIFTED') {
      checkResult.status = 'failed'
      checkResult.message =
        `${stackDriftDescribeResponse.DriftedStackResourceCount} resources have drifted on stack ${stackName}`
    } else {
      checkResult.status = 'error'
      checkResult.message = `Unexpected status '${stackDriftStatus} while checking ${stackName}`
    }
  } catch (e) {
    checkResult.status = 'error'
    checkResult.message = e.message
  } finally {
    if (progressLogger !== undefined) {
      progressLogger.write('\nStack drift check complete.\n')
    }
  }

  return [checkResult]
}

const processFetchResults = ({ domain, fetchResponse }) => {
  const result = {
    check   : `site ${domain} is up`,
    message : `Got HTTP status ${fetchResponse.status} fetching https://${domain}.`
  }

  if (fetchResponse.status === 200) {
    result.status = 'success'
  } else {
    result.status = 'failed'
  }

  return result
}

export { verify }
