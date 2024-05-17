import commandLineArgs from 'command-line-args'

import { cliSpec } from '../../constants'
import { dnsStatus } from '../../../lib/actions/dns/status'
import { getCredentials } from '../../../lib/actions/lib/get-credentials'
import { getSiteInfo } from '../get-site-info'

const handleDNSStatus = async ({ argv, db }) => {
  const dnsStatusOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'dns')
    .commands.find(({ name }) => name === 'status')
    .arguments || []
  const dnsStatusOptions = commandLineArgs(dnsStatusOptionsSpec, { argv })
  const { 'apex-domain': apexDomain } = dnsStatusOptions

  const credentials = getCredentials(db.account.localSettings)

  const siteInfo = getSiteInfo({ apexDomain, db })

  const status = await dnsStatus({ credentials,siteInfo })
  return { success : true, data : status }
}

export { handleDNSStatus }
