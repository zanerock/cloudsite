import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { destroy } from '../../lib/actions/destroy'
import { getSiteInfo } from './get-site-info'

const handleDestroy = async ({ argv, globalOptions, sitesInfo }) => {
  const destroyOptionsSpec = cliSpec.commands.find(({ name }) => name === 'destroy').arguments
  const destroyOptions = commandLineArgs(destroyOptionsSpec, { argv })
  const apexDomain = destroyOptions['apex-domain']
  const { confirmed } = destroyOptions

  const siteInfo = getSiteInfo({ apexDomain, sitesInfo })

  if (confirmed !== true) {
    process.stderr.write("Interactive mode not yet implement. You must include the '--confirmed' option.\n")
    process.exit(3) // eslint-disable-line no-process-exit
  }

  const deleted = await destroy({ globalOptions, siteInfo, verbose : true })

  if (deleted === true) {
    process.stdout.write(`Removing ${apexDomain} from local DB.\n`)
    delete sitesInfo[apexDomain]
  }
}

export { handleDestroy }
