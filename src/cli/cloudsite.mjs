import * as fs from 'node:fs/promises'

import commandLineArgs from 'command-line-args'
import { commandLineDocumentation } from 'command-line-documentation'
import isEqual from 'lodash/isEqual'

import { cliSpec, DB_PATH } from './constants'
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

const cloudsite = async () => {
  const mainOptions = commandLineArgs(cliSpec.mainOptions, { stopAtFirstUnknown : true })
  const argv = mainOptions._unknown || []

  const { command/*, quiet */ } = mainOptions
  const throwError = mainOptions['throw-error']

  let db
  try {
    const dbContents = await fs.readFile(DB_PATH, { encoding : 'utf8' })
    db = JSON.parse(dbContents)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
    // otherwise, it's fine, there just are no options
    db = { account: { settings: {} }, sites: {}, todos: [], reminders: [] }
  }

  const origDB = structuredClone(db)

  let exitCode = 0
  try {
    switch (command) {
      case 'configuration':
        await handleConfiguration({ argv, cliSpec, db }); break
      case 'create':
        await handleCreate({ argv, db }); break
      case 'destroy':
        await handleDestroy({ argv, db }); break
      case 'detail':
        await handleDetail({ argv, db }); break
      case 'document':
        console.log(commandLineDocumentation(cliSpec, { sectionDepth : 2, title : 'Command reference' }))
        break
      case 'get-iam-policy':
        await handleGetIAMPolicy({ argv, db }); break
      case 'list':
        await handleList({ argv, db }); break
      case 'import':
        await handleImport({ argv, db }); break
      case 'plugin-settings':
        await handlePluginSettings({ argv, db }); break
      case 'update':
        await handleUpdate({ argv, db }); break
      case 'verify':
        await handleVerify({ argv, db }); break
      default:
        process.stderr.write('Uknown command: ' + command + '\n\n')
        exitCode = 10
      // TODO: handleHelp() (abstriact from cloudcraft)
    }
  } catch (e) {
    if (throwError === true) {
      throw e
    } else if (e.name === 'CredentialsProviderError') {
      let message = 'Your AWS login credentials may have expired. Update your credentials or try refreshing with:\n\naws sso login'
      if (globalOptions.ssoProfile !== undefined) {
        message += ' --profile ' + globalOptions.ssoProfile
      }
      message += '\n'
      process.stderr.write(message)
      exitCode = 2
    } else {
      process.stderr.write(e.message + '\n')
      exitCode = e.exitCode || 11
    }
  } finally {
    await checkAndUpdateSitesInfo({ origDB, db })
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
