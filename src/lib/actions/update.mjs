import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

import { getCredentials } from './lib/get-credentials'
import { syncSiteContent } from './lib/sync-site-content'

const update = async ({ /* onlyContent, */ noCacheInvalidation, siteInfo, ...downstreamOptions }) => {
  const credentials = getCredentials(downstreamOptions)

  // method will reeport actions to user
  await syncSiteContent({ credentials, siteInfo })

  if (noCacheInvalidation !== true) {
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
