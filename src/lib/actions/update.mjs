import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

import { addTagsToHostedZone } from './lib/add-tags-to-hosted-zone'
import { associateCostAllocationTags } from './lib/associate-cost-allocation-tags'
import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'
import { checkAdminAuthentication, getCredentials } from '../shared/authentication-lib'
import { progressLogger } from '../shared/progress-logger'
import { syncSiteContent } from './lib/sync-site-content'
import { updatePlugins } from './lib/update-plugins'
import { updateStack } from './lib/update-stack'

const update = async ({
  db,
  doBilling,
  doContent,
  doDNS,
  doStack,
  globalOptions,
  noBuild,
  noCacheInvalidation,
  siteInfo
}) => {
  const doAll = doBilling === undefined && doContent === undefined && doDNS === undefined && doStack === undefined

  const credentials = getCredentials(globalOptions)
  if (doAll === true || doStack === true) {
    await checkAdminAuthentication({ credentials, db })
  }

  const firstRoundUpdates = []
  if (doAll === true || doContent === true) {
    // method will report actions to user
    firstRoundUpdates.push(syncSiteContent({ credentials, noBuild, siteInfo }))
  }

  if (doAll === true || doDNS === true) {
    firstRoundUpdates.push(createOrUpdateDNSRecords({ credentials, siteInfo }))
  }

  await Promise.all(firstRoundUpdates)

  let stackUpdateStatus
  if (doAll === true || doStack === true) {
    stackUpdateStatus = await updateStack({ credentials, siteInfo })
    if (stackUpdateStatus === 'UPDATE_COMPLETE') {
      await updatePlugins({ credentials, siteInfo })
      // have to do this after the other updates so that the tags get created first
    }
  }

  const secondRoundUpdates = []

  if (doAll === true || doBilling === true) {
    await associateCostAllocationTags({ credentials, db, siteInfo })
  }

  if (doAll === true || doDNS === true) {
    secondRoundUpdates.push(addTagsToHostedZone({ credentials, siteInfo }))
  }

  if ((doAll === true || doContent === true) && noCacheInvalidation !== true) {
    secondRoundUpdates.push(invalidateCache({ credentials, siteInfo }))
  }

  await Promise.all(secondRoundUpdates)

  return { doAll }
}

const invalidateCache = async ({ credentials, siteInfo }) => {
  progressLogger.write('Invalidating CloudFront cache...\n')

  const { cloudFrontDistributionID } = siteInfo

  const cloudFrontClient = new CloudFrontClient({ credentials })
  const invalidateCacheCommand = new CreateInvalidationCommand({
    DistributionId    : cloudFrontDistributionID,
    InvalidationBatch : {
      Paths : {
        Quantity : 1,
        Items    : ['/*']
      },
      CallerReference : new Date().getTime() + ''
    }
  })
  await cloudFrontClient.send(invalidateCacheCommand)
}

export { update }
