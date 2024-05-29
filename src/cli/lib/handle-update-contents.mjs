import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getCredentials } from '../../lib/shared/authentication-lib'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'
import { updateContents } from '../../lib/actions/update-contents'

const handleUpdateContents = async ({ argv, db, globalOptions }) => {
  const updateOptionsSpec = getOptionsSpec({ cliSpec, name : 'update-contents' })
  const updateOptions = commandLineArgs(updateOptionsSpec, { argv })
  const apexDomain = updateOptions['apex-domain']
  const noBuild = updateOptions['no-build']
  const noCacheInvalidation = updateOptions['no-cache-invalidation']

  const siteInfo = getSiteInfo({ apexDomain, db, globalOptions })

  const credentials = getCredentials(globalOptions)

  await updateContents({ credentials, db, globalOptions, noBuild, noCacheInvalidation, siteInfo })

  return { success : true, userMessage : `Updated '${apexDomain}' contents.` }
}

export { handleUpdateContents }
