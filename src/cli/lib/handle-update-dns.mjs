import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getCredentials } from '../../lib/shared/authentication-lib'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'
import { updateDNS } from '../../lib/actions/update-dns'

const handleUpdateDNS = async ({ argv, db, globalOptions }) => {
  const updateOptionsSpec = getOptionsSpec({ cliSpec, name : 'update-dns' })
  const updateOptions = commandLineArgs(updateOptionsSpec, { argv })
  const apexDomain = updateOptions['apex-domain']

  const siteInfo = getSiteInfo({ apexDomain, db, globalOptions })

  const credentials = getCredentials(globalOptions)

  await updateDNS({ credentials, db, globalOptions, siteInfo })

  return { success : true, userMessage : `Updated '${apexDomain}' DNS.` }
}

export { handleUpdateDNS }
