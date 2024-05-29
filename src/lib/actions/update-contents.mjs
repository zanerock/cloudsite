import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'

import { progressLogger } from '../shared/progress-logger'
import { syncSiteContent } from './lib/sync-site-content'

const updateContents = async ({ credentials, noBuild, noCacheInvalidation, siteInfo }) => {
  await syncSiteContent({ credentials, noBuild, siteInfo })

  if (noCacheInvalidation !== true) {
    await invalidateCache({ credentials, siteInfo })
  }
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

export { updateContents }
