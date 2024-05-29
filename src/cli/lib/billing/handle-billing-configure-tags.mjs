import commandLineArgs from 'command-line-args'

import { ACTION_SETUP_BILLING, cliSpec } from '../../constants'
import { billingConfigureTags } from '../../../lib/actions/billing/billing-configure-tags'
import { getCredentials } from '../../../lib/shared/authentication-lib'

const handleBillingConfigureTags = async ({ argv, db, globalOptions }) => {

  const credentials = getCredentials(globalOptions)

  await billingConfigureTags({ credentials, db })

  db.reminders.splice(db.reminders.findIndex(({ todo, references }) => todo === ACTION_SETUP_BILLING), 1)

  return { success : true, userMessage : 'Configured billing tags.' }
}

export { handleBillingConfigureTags }
