import { addTagsToHostedZone } from './lib/add-tags-to-hosted-zone'
import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'
import { progressLogger } from '../shared/progress-logger'

const updateDNS = async ({ credentials, db, globalOptions, noBuild, noCacheInvalidation, siteInfo }) => {
  await createOrUpdateDNSRecords({ credentials, siteInfo })
  await addTagsToHostedZone({ credentials, siteInfo })
}

export { updateDNS }
