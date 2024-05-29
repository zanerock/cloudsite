import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getCredentials, checkAdminAuthentication } from '../../lib/shared/authentication-lib'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'
import { updateStack } from '../../lib/actions/update-stack'

const handleUpdateStack = async ({ argv, db, globalOptions }) => {
  const updateOptionsSpec = getOptionsSpec({ cliSpec, name : 'update-stack' })
  const updateOptions = commandLineArgs(updateOptionsSpec, { argv })
  const apexDomain = updateOptions['apex-domain']

  const siteInfo = getSiteInfo({ apexDomain, db, globalOptions })

  const credentials = getCredentials(globalOptions)
  await checkAdminAuthentication({ credentials, db })

  const { success = true, userMessage = `Updated '${apexDomain}' stack.` } =
    await updateStack({ credentials, db, globalOptions, siteInfo }) || {}

  return { success, userMessage }
}

export { handleUpdateStack }
