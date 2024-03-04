import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { update } from '../../lib/actions/update'

const handleUpdate = async ({ argv, globalOptions, sitesInfo }) => {
  const updateOptionsSpec = cliSpec.commands.find(({ name }) => name === 'update').arguments
  const updateOptions = commandLineArgs(updateOptionsSpec, { argv })
  const apexDomain = updateOptions['apex-domain']
  const noBuild = updateOptions['no-build']
  const noCacheInvalidation = updateOptions['no-cache-invalidation']
  const onlyContent = updateOptions['only-content']

  const siteInfo = sitesInfo[apexDomain]
  if (siteInfo === undefined) {
    process.stderr.write(`No such site '${apexDomain}' found.\n`)
    process.exit(1) // eslint-disable-line no-process-exit
  }

  await update({ noBuild, noCacheInvalidation, onlyContent, siteInfo, ...globalOptions })
}

export { handleUpdate }
