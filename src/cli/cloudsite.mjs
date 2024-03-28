import * as fs from 'node:fs/promises'

import commandLineArgs from 'command-line-args'
import { commandLineDocumentation } from 'command-line-documentation'
import isEqual from 'lodash/isEqual'

import { cliSpec, DB_PATH } from './constants'
import { checkReminders } from './lib/check-reminders'
import { configureLogger, progressLogger } from '../lib/shared/progress-logger'
import { getGlobalOptions } from './lib/get-global-options'
import { handleCleanup } from './lib/handle-cleanup'
import { handleConfiguration } from './lib/handle-configuration'
import { handleCreate } from './lib/handle-create'
import { handleDestroy } from './lib/handle-destroy'
import { handleDetail } from './lib/handle-detail'
import { handleGetIAMPolicy } from './lib/handle-get-iam-policy'
import { handleList } from './lib/handle-list'
import { handleImport } from './lib/handle-import'
import { handlePluginSettings } from './lib/handle-plugin-settings'
import { handleUpdate } from './lib/handle-update'
import { handleVerify } from './lib/handle-verify'
import { processGlobalOptions } from './lib/process-global-options'

const cloudsite = async () => {
  // we can 'stopAtFirstUnknown' because the globals are defined at the root level
  const mainOptions = commandLineArgs(cliSpec.mainOptions, { stopAtFirstUnknown : true })
  const argv = mainOptions._unknown || []

  const { command/*, quiet */ } = mainOptions

  let db
  try {
    const dbContents = await fs.readFile(DB_PATH, { encoding : 'utf8' })
    db = JSON.parse(dbContents)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
    // otherwise, it's fine, there just are no options
    db = { account : { settings : {} }, sites : {}, toCleanup : {}, reminders : [] }
  }

  const globalOptions = getGlobalOptions({ db })
  const ssoProfile = globalOptions['sso-profile']
  const throwError = globalOptions['throw-error']

  configureLogger(globalOptions)

  checkReminders({ reminders : db.reminders })

  const origDB = structuredClone(db)

  let exitCode = 0
  let userMessage
  try {
    switch (command) {
      case 'cleanup':
        { success, userMessage } = await handleCleanup({ argv, db }); break
      case 'configuration':
        userMessage = await handleConfiguration({ argv, db }); break
      case 'create':
        userMessage = await handleCreate({ argv, db }); break
      case 'destroy':
        userMessage = await handleDestroy({ argv, db }); break
      case 'detail':
        userMessage = await handleDetail({ argv, db }); break
      case 'document':
        console.log(commandLineDocumentation(cliSpec, { sectionDepth : 2, title : 'Command reference' }))
        break
      case 'get-iam-policy':
        userMessage = await handleGetIAMPolicy({ argv, db }); break
      case 'list':
        userMessage = await handleList({ argv, db }); break
      case 'import':
        userMessage = await handleImport({ argv, db }); break
      case 'plugin-settings':
        userMessage = await handlePluginSettings({ argv, db }); break
      case 'update':
        userMessage = await handleUpdate({ argv, db }); break
      case 'verify':
        userMessage = await handleVerify({ argv, db }); break
      default:
        process.stderr.write('Uknown command: ' + command + '\n\n')
        exitCode = 10
      // TODO: handleHelp() (abstriact from cloudcraft)
    }
  } catch (e) {
    if (throwError === true) {
      throw e
    } else if (e.name === 'CredentialsProviderError') {
      userMessage = 'Your AWS login credentials may have expired. Update your credentials or try refreshing with:\n\naws sso login'
      if (ssoProfile !== undefined) {
        userMessage += ' --profile ' + ssoProfile
      }
      exitCode = 2
    } else {
      userMessage = e.message
      exitCode = e.exitCode || 11
    }
  } finally {
    await checkAndUpdateSitesInfo({ origDB, db })
  }

  const actionStatus = {
    success: exitCode === 0 && success === true,
    status: exitCode !== 0 ? 'ERROR' : (success === true ? 'SUCCESS' : 'FAILURE'),
    userMessage
  }

  const { format } = getGlobalOptions()

  if (format === 'json' || format === 'yaml') {
    progressLogger.write(actionStatus)
  }
  else {
    const { status, userMessage } = actionStatus
    const message = userMessage
    if (status === 'ERROR') {
      message = '<error>!! ERROR !!<rst>: ' + message
    }
    else if (status === 'FAILURE') {
      message = '<warn>Command FAILED: </rst>' + message
    }
    progressLogger.write(message + '\n')
  }

  process.stderr.write(userMessage + '\n')

  process.exit(exitCode) // eslint-disable-line no-process-exit
}

const checkAndUpdateSitesInfo = async ({ origDB, db }) => {
  if (!isEqual(origDB, db)) {
    const dbContents = JSON.stringify(db, null, '  ')
    await fs.writeFile(DB_PATH, dbContents, { encoding : 'utf8' })
  }
}

export { cloudsite }
