import commandLineArgs from 'command-line-args'

import { ACTION_SETUP_BILLING, cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'
import { update } from '../../lib/actions/update'

const handleUpdate = async ({ argv, db }) => {
  const updateOptionsSpec = getOptionsSpec({ cliSpec, name : 'update' })
  const updateOptions = commandLineArgs(updateOptionsSpec, { argv })
  const apexDomain = updateOptions['apex-domain']
  const doBilling = updateOptions['do-billing']
  const doContent = updateOptions['do-content']
  const doDNS = updateOptions['do-dns']
  const doStack = updateOptions['do-stack']
  const noBuild = updateOptions['no-build']
  const noCacheInvalidation = updateOptions['no-cache-invalidation']

  const siteInfo = getSiteInfo({ apexDomain, db })

  const { doAll } = await update({ db, doBilling, doContent, doDNS, doStack, noBuild, noCacheInvalidation, siteInfo })

  if (doAll === true || doBilling === true) {
    db.reminders.splice(db.reminders.findIndex(({ action, apexDomain: testDomain }) => 
        action === ACTION_SETUP_BILLING && testDomain === apexDomain), 1)
  }

  return { success : true, userMessage : `Updated '${apexDomain}' site.` }
}

export { handleUpdate }
