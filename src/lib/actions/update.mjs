import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'
import { getCredentials } from './lib/get-credentials'
import { syncSiteContent } from './lib/sync-site-content'

const update = async ({ doContent, doDNS, noBuild, noCacheInvalidation, siteInfo, ...downstreamOptions }) => {
  const doAll = !doContent && !doDNS

  const credentials = getCredentials(downstreamOptions)

  if (doAll === true || doContent === true) {
    // method will report actions to user
    await syncSiteContent({ credentials, noBuild, siteInfo })
  }

  if (doAll === true || doDNS === true) {
    await createOrUpdateDNSRecords({ credentials, siteInfo })
  }

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
