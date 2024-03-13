import { S3Client } from '@aws-sdk/client-s3'
import { S3SyncClient } from 's3-sync-client'

import { getCredentials } from './lib/get-credentials'

const verify = async ({ checkContent, checkSiteUp, checkStack, siteInfo, globalOptions }) => {
  const checkAll = checkContent === undefined && checkSiteUp === undefined && checkStack === undefined
  let credentials
  if (checkAll || checkContent || checkStack) {
    credentials = getCredentials(globalOptions)
  }

  const checks = []
  if (checkAll || checkSiteUp) {
    checks.push(doCheckSiteUp({ siteInfo }))
  }
  if (checkAll || checkContent) {
    checks.push(doCheckContent({ credentials, siteInfo }))
  }

  const results = await Promise.all(checks)

  return results.reduce((acc, array) => { acc.push(...array); return acc }, [])
}

const doCheckContent = async ({ credentials, siteInfo }) => {
  const { bucketName, sourcePath } = siteInfo

  const s3Client = new S3Client({ credentials })
  const { sync } = new S3SyncClient({ client : s3Client })

  let objectData
  const checkResult = { check : 'S3 bucket and local source in sync' }
  try {
    objectData = await sync(sourcePath, 's3://' + bucketName, { dryRun : true })
  } catch (e) {
    checkResult.status = 'error'
    checkResult.message = e.message

    return [checkResult]
  }
  // if no error

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
}

const doCheckSiteUp = async ({ siteInfo }) => {
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
  }
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
