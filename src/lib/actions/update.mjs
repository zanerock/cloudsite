import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

import { addTagsToHostedZone } from './lib/add-tags-to-hosted-zone'
import {
  associateCostAllocationTags,
  handleAssociateCostAllocationTagsError
} from './lib/associate-cost-allocation-tags'
import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'
import { getCredentials } from './lib/get-credentials'
import { getSiteTag } from '../shared/get-site-tag'
import { syncSiteContent } from './lib/sync-site-content'
import { updatePlugins } from './lib/update-plugins'
import { updateStack } from './lib/update-stack'

const update = async ({
  doBilling,
  doContent,
  doDNS,
  doStack,
  noBuild,
  noCacheInvalidation,
  siteInfo,
  globalOptions
}) => {
  const doAll = doBilling === undefined && doContent === undefined && doDNS === undefined && doStack === undefined

  const credentials = getCredentials(globalOptions)

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
    const siteTag = getSiteTag(siteInfo)
    try {
      await associateCostAllocationTags({ credentials, tag : siteTag })
    } catch (e) {
      handleAssociateCostAllocationTagsError({ e, siteInfo })
    }
  }

  if (doAll === true || doDNS === true) {
    secondRoundUpdates.push(addTagsToHostedZone({ credentials, siteInfo }))
  }

  if ((doAll === true || doContent === true) && noCacheInvalidation !== true) {
    secondRoundUpdates.push(invalidateCache({ credentials, siteInfo }))
  }

  await Promise.all(secondRoundUpdates)
}

const invalidateCache = async ({ credentials, siteInfo }) => {
  process.stdout.write('Invalidating CloudFront cache...\n')

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
