import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { handleDNSStatus } from './dns/handle-dns-status'

const handleDNS = async ({ argv, db }) => {
  const dnsOptionsSpec = getOptionsSpec({ cliSpec, name : 'configuration' })
  const dnsOptions = commandLineArgs(dnsOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { subcommand } = dnsOptions
  argv = dnsOptions._unknown || []

  switch (subcommand) {
    case 'status':
      return await handleDNSStatus({ argv, db })
    default:
      throw new Error('Unknown configuration command: ' + subcommand)
  }
}

export { handleDNS }
