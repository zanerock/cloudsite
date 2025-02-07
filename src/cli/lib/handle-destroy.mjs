import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { destroy } from '../../lib/actions/destroy'

const handleDestroy = async ({ argv, globalOptions, sitesInfo }) => {
  const destroyOptionsSpec = cliSpec.commands.find(({ name }) => name === 'destroy').arguments
  const destroyOptions = commandLineArgs(destroyOptionsSpec, { argv })
  const apexDomain = destroyOptions['apex-domain']
  const { confirmed } = destroyOptions

  if (confirmed !== true) {
    process.stderr.write("Interactive mode not yet implement. You must include the '--confirmed' option.\n")
    process.exit(3) // eslint-disable-line no-process-exit
  }

  const siteInfo = sitesInfo[apexDomain]
  if (siteInfo === undefined) {
    process.stderr.write(`No such site '${apexDomain}' found.\n`)
    process.exit(1) // eslint-disable-line no-process-exit
  }

  await destroy({ siteInfo, ...globalOptions })
}

export { handleDestroy }
