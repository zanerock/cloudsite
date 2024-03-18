import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

import { addTagsToHostedZone } from './lib/add-tags-to-hosted-zone'
import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'
import { getCredentials } from './lib/get-credentials'
import { syncSiteContent } from './lib/sync-site-content'
import { updatePlugins } from './lib/update-plugins'
import { updateStack } from './lib/update-stack'

const update = async ({ doContent, doDNS, doStack, noBuild, noCacheInvalidation, siteInfo, globalOptions }) => {
  const doAll = doContent === undefined && doDNS === undefined && doStack === undefined

  const credentials = getCredentials(globalOptions)

  const updates = []
  if (doAll === true || doContent === true) {
    // method will report actions to user
    updates.push(syncSiteContent({ credentials, noBuild, siteInfo }))
  }

  if (doAll === true || doDNS === true) {
    updates.push(createOrUpdateDNSRecords({ credentials, siteInfo }))
    updates.push(addTagsToHostedZone({ credentials, siteInfo }))
  }

  if (doAll === true || doStack === true) {
    updates.push(updateStack({ credentials, siteInfo }))
    updates.push(updatePlugins({ credentials, siteInfo }))
  }

  await Promise.all(updates)

  if ((doAll === true || doContent === true) && noCacheInvalidation !== true) {
    await invalidateCache({ credentials, siteInfo })
  }
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
