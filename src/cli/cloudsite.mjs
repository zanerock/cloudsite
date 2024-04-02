import * as fs from 'node:fs/promises'

import commandLineArgs from 'command-line-args'
import { commandLineDocumentation } from 'command-line-documentation'
import { commandLineHelp } from 'command-line-help'
import isEqual from 'lodash/isEqual'

import { cliSpec, DB_PATH, globalOptionsSpec } from './constants'
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
import { handleReminders } from './lib/handle-reminders'
import { handleUpdate } from './lib/handle-update'
import { handleVerify } from './lib/handle-verify'

const cloudsite = async () => {
  // we can 'stopAtFirstUnknown' because the globals are defined at the root level
  const mainOptions = commandLineArgs(cliSpec.mainOptions, { partial : true })
  const argv = mainOptions._unknown || []

  const { command, help /*, quiet */ } = mainOptions
  const noReminders = mainOptions['no-reminders']

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
  const { format } = globalOptions
  const noColor = globalOptions['no-color']
  const ssoProfile = globalOptions['sso-profile']
  const throwError = globalOptions['throw-error']

  configureLogger(globalOptions)

  if (help === true) {
    const commands = command === undefined
      ? []
      : [command, ...(mainOptions._unknown?.filter((option) => !option.startsWith('--')) || [])]

    const clhOptions = { cliSpec, commands, mainOptionsGlobal : true, noColor }
    if (commands.length !== 0) { // then we inject the globalOptions
      clhOptions.globalOptions = globalOptionsSpec
    }

    const help = commandLineHelp(clhOptions)
    progressLogger.write(help + '\n', { hangingIndent : 4 })
    process.exit(0) // eslint-disable-line no-process-exit
  }

  if (noReminders !== true) {
    checkReminders({ reminders : db.reminders })
  }

  const origDB = structuredClone(db)

  let data
  let exitCode = 0
  let userMessage
  let success
  try {
    switch (command) {
      case 'cleanup':
        ({ success, userMessage } = await handleCleanup({ argv, db })); break
      case 'configuration':
        ({ data, success, userMessage } = await handleConfiguration({ argv, db })); break
      case 'create':
        ({ success, userMessage } = await handleCreate({ argv, db })); break
      case 'destroy':
        ({ success, userMessage } = await handleDestroy({ argv, db })); break
      case 'detail':
        ({ data, success } = await handleDetail({ argv, db })); break
      case 'document':
        console.log(commandLineDocumentation(cliSpec, { sectionDepth : 2, title : 'Command reference' }))
        success = true
        userMessage = 'Documentation generated.'
        break
      case 'get-iam-policy':
        await handleGetIAMPolicy({ argv, db })
        return // get-iam-policy is handles it's own output as the IAM policy is always in JSON format
      case 'list':
        ({ data, success } = await handleList({ argv, db })); break
      case 'import':
        ({ success, userMessage } = await handleImport({ argv, db })); break
      case 'plugin-settings':
        ({ data, success, userMessage } = await handlePluginSettings({ argv, db })); break
      case 'reminders':
        ({ data, success } = await handleReminders({ argv, db })); break
      case 'update':
        ({ success, userMessage } = await handleUpdate({ argv, db })); break
      case 'verify':
        ({ data } = await handleVerify({ argv, db })); break
      case undefined:
        throw new Error("Must specify command or '--help' option.", { exitCode : 1 })
      default:
        throw new Error('Unknown command: ' + command, { exitCode : 10 })
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
      userMessage = e.message +
        `\n\nFor more information, try:\n<em>cloudsite --help${command === undefined ? '' : ' <command(s)>'}<rst>`
      exitCode = e.exitCode || 11
    }
  } finally {
    await checkAndUpdateSitesInfo({ origDB, db })
  }

  globalOptions.quiet = false // always send the final status message

  const actionStatus = {
    success : exitCode === 0 && success === true,
    status  : exitCode !== 0 ? 'ERROR' : (success === true ? 'SUCCESS' : 'FAILURE'),
    userMessage
  }

  if (data !== undefined) {
    actionStatus.data = data
  }

  // is it a data format
  if (format === 'json' || format === 'yaml') {
    progressLogger.write(actionStatus, '')
  } else { // then it's a 'human' format
    if (data !== undefined) {
      progressLogger.write(data, '')
    }

    if (userMessage !== undefined) {
      const { status, userMessage } = actionStatus
      let message = userMessage
      if (status === 'ERROR') {
        message = '<error>!! ERROR !!<rst>: ' + message
      } else if (status === 'FAILURE') {
        message = '<warn>Command FAILED: <rst>' + message
      }
      progressLogger.write(message + '\n')
    }
  }

  process.exit(exitCode) // eslint-disable-line no-process-exit
}

const checkAndUpdateSitesInfo = async ({ origDB, db }) => {
  if (!isEqual(origDB, db)) {
    const dbContents = JSON.stringify(db, null, '  ')
    await fs.writeFile(DB_PATH, dbContents, { encoding : 'utf8' })
  }
}

export { cloudsite }
