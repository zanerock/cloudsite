import { ACTION_SETUP_BILLING } from '../../constants'
import { billingConfigureTags } from '../../../lib/actions/billing/billing-configure-tags'
import { getCredentials } from '../../../lib/shared/authentication-lib'

const handleBillingConfigureTags = async ({ db, globalOptions }) => {
  const credentials = getCredentials(globalOptions)

  await billingConfigureTags({ credentials, db })

  db.reminders.splice(db.reminders.findIndex(({ todo }) => todo === ACTION_SETUP_BILLING), 1)

  return { success : true, userMessage : 'Configured billing tags.' }
}

export { handleBillingConfigureTags }
