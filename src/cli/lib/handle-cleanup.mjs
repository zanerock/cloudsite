import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { destroy } from '../../lib/actions/destroy'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleCleanup = async ({ argv, db }) => {
  const cleanupOptionsSpec = cliSpec.commands.find(({ name }) => name === 'cleanup').arguments
  const cleanupOptions = commandLineArgs(cleanupOptionsSpec, { argv })
  const apexDomain = cleanupOptions['apex-domain']
  const { list } = cleanupOptions

  if (list === true) {
    progressLogger.write(Object.keys(db.toCleanup).join('\n') + '\n')
    return
  }

  const listOfSitesToCleanup = apexDomain === undefined
    ? Object.keys(db.toCleanup)
    : [apexDomain]

  const deleteActions = listOfSitesToCleanup
    .map((apexDomain) => {
      progressLogger.write(`Cleaning up ${apexDomain}...\n`)
      return destroy({ db, siteInfo : db.toCleanup[apexDomain], verbose : false })
    })

  progressLogger.write('.')
  const intervalID = setInterval(() => progressLogger.write('.'), 2000)
  const cleanupResults = await Promise.all(deleteActions)
  clearInterval(intervalID)
  progressLogger.write('\n')

  listOfSitesToCleanup.forEach((apexDomain, i) => {
    const cleanupResult = cleanupResults[i]
    progressLogger.write(`${apexDomain}: ${cleanupResult === true ? 'CLEANED' : 'NOT cleaned'}\n`)
    if (cleanupResult === true) {
      delete db.toCleanup[apexDomain]
      db.reminders.splice(db.reminders.findIndex(({ apexDomain: testDomain }) => testDomain === apexDomain), 1)
    }
  })
}

export { handleCleanup }
