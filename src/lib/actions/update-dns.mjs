import { addTagsToHostedZone } from './lib/add-tags-to-hosted-zone'
import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'

const updateDNS = async ({ credentials, siteInfo }) => {
  await createOrUpdateDNSRecords({ credentials, siteInfo })
  await addTagsToHostedZone({ credentials, siteInfo })
}

export { updateDNS }
