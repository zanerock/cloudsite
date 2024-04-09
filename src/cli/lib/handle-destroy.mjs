import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { ACTION_CLEANUP, cliSpec } from '../constants'
import { destroy } from '../../lib/actions/destroy'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleDestroy = async ({ argv, db }) => {
  const destroyOptionsSpec = getOptionsSpec({ cliSpec, name : 'destroy' })
  const destroyOptions = commandLineArgs(destroyOptionsSpec, { argv })
  const apexDomain = destroyOptions['apex-domain']
  let { confirmed } = destroyOptions

  const siteInfo = getSiteInfo({ apexDomain, db })

  if (confirmed !== true) {
    const interrogationBundle = {
      actions : [{
        prompt    : `Confirm destruction of '${apexDomain}'?`,
        paramType : 'boolean',
        parameter : 'confirmed'
      }]
    }
    const questioner = new Questioner({ interrogationBundle, output : progressLogger })
    await questioner.question()
    confirmed = questioner.getResult('confirmed').value

    if (confirmed !== true) {
      progressLogger.write('Not confirmed; canceling operation.\n')
      return
    }
  }

  const deleted = await destroy({ db, siteInfo, verbose : true })

  if (deleted === true) {
    delete db.sites[apexDomain]
    return { success : true, userMessage : `${apexDomain} deleted.\nRemoved ${apexDomain} from local DB.\n` }
  } else {
    const now = new Date()
    const remindAfter = new Date(now.getTime() + 2 * 60 * 60 * 1000) // give it 2 hours
    siteInfo.lastCleanupAttempt = now.toISOString()
    db.toCleanup[apexDomain] = siteInfo
    // delete existing reminders; they'r no longer valid
    db.reminders = db.reminders.filter(({ references }) => references !== apexDomain)
    db.reminders.push({
      todo        : ACTION_CLEANUP,
      command     : `cloudsite cleanup ${apexDomain}`,
      remindAfter : remindAfter.toISOString(),
      references  : apexDomain
    })
    delete db.sites[apexDomain]

    return { success : false, userMessage : `The delete has failed, which is expected because the 'replicated Lambda functions' need to be cleared by AWS before all resources can be deleted. This can take 30 min to a few hours.\n\nThe site has been marked for cleanup and you can now create new sites using the '${apexDomain}' domain.\n\nYou can complete deletion by executing:\ncloudsite cleanup\n` }
  }
}

export { handleDestroy }
