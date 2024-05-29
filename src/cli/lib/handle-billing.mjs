import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { handleBillingConfigureTags } from './billing/handle-billing-configure-tags'

const handleBilling = async ({ argv, db, globalOptions }) => {
  const billingOptionsSpec = getOptionsSpec({ cliSpec, name : 'billing' })
  const billingOptions = commandLineArgs(billingOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { subcommand } = billingOptions
  argv = billingOptions._unknown || []

  switch (subcommand) {
    case 'configure-tags':
      return await handleBillingConfigureTags({ argv, db })
    default:
      throw new Error('Unknown billing command: ' + subcommand)
  }
}

export { handleBilling }
