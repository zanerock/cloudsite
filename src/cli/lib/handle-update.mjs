import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getSiteInfo } from './get-site-info'
import { update } from '../../lib/actions/update'

const handleUpdate = async ({ argv, globalOptions, sitesInfo }) => {
  const updateOptionsSpec = cliSpec.commands.find(({ name }) => name === 'update').arguments
  const updateOptions = commandLineArgs(updateOptionsSpec, { argv })
  const apexDomain = updateOptions['apex-domain']
  const doContent = updateOptions['do-content']
  const doDNS = updateOptions['do-dns']
  const noBuild = updateOptions['no-build']
  const noCacheInvalidation = updateOptions['no-cache-invalidation']

  const siteInfo = getSiteInfo({ apexDomain, sitesInfo })

  await update({ doContent, doDNS, noBuild, noCacheInvalidation, siteInfo, ...globalOptions })
}

export { handleUpdate }
