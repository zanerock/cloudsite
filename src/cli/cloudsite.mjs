import * as fs from 'node:fs/promises'

import commandLineArgs from 'command-line-args'
import { commandLineDocumentation } from 'command-line-documentation'
import isEqual from 'lodash/isEqual'

import { cliSpec, GLOBAL_OPTIONS_PATH, SITES_INFO_PATH } from './constants'
import { handleConfiguration } from './lib/handle-configuration'
import { handleCreate } from './lib/handle-create'
import { handleDestroy } from './lib/handle-destroy'
import { handleDetail } from './lib/handle-detail'
import { handleGetIAMPolicy } from './lib/handle-get-iam-policy'
import { handleList } from './lib/handle-list'
import { handlePluginSettings } from './lib/handle-plugin-settings'
import { handleUpdate } from './lib/handle-update'
import { handleVerify } from './lib/handle-verify'

const cloudsite = async () => {
  const mainOptions = commandLineArgs(cliSpec.mainOptions, { stopAtFirstUnknown : true })
  const argv = mainOptions._unknown || []

  const { command/*, quiet */ } = mainOptions
  const throwError = mainOptions['throw-error']

  let globalOptions
  try {
    const globalOptionsContent = await fs.readFile(GLOBAL_OPTIONS_PATH, { encoding : 'utf8' })
    globalOptions = JSON.parse(globalOptionsContent)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
    // otherwise, it's fine, there just are no options
    globalOptions = {}
  }
  let sitesInfo
  if (command !== 'configuration') {
    try {
      const sitesInfoContent = await fs.readFile(SITES_INFO_PATH, { encoding : 'utf8' })
      sitesInfo = JSON.parse(sitesInfoContent)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e
      }
      // otherwise it's fine, there's just no sites info file yet
      sitesInfo = {}
    }
  }
  const origSitesInfo = structuredClone(sitesInfo)

  try {
    switch (command) {
      case 'configuration':
        await handleConfiguration({ argv, cliSpec, globalOptions }); break
      case 'create':
        await handleCreate({ argv, globalOptions, sitesInfo }); break
      case 'destroy':
        await handleDestroy({ argv, globalOptions, sitesInfo }); break
      case 'detail':
        await handleDetail({ argv, globalOptions, sitesInfo }); break
      case 'document':
        console.log(commandLineDocumentation(cliSpec, { sectionDepth : 2, title : 'Command reference' }))
        break
      case 'get-iam-policy':
        await handleGetIAMPolicy({ argv }); break
      case 'list':
        await handleList({ argv, globalOptions, sitesInfo }); break
      case 'plugin-settings':
        await handlePluginSettings({ argv, globalOptions, sitesInfo }); break
      case 'update':
        await handleUpdate({ argv, globalOptions, sitesInfo }); break
      case 'verify':
        await handleVerify({ argv, globalOptions, sitesInfo }); break
      default:
        process.stderr.write('Uknown command: ' + command + '\n\n')
      // TODO: handleHelp() (abstriact from cloudcraft)
    }
  } catch (e) {
    await checkAndUpdateSitesInfo({ origSitesInfo, sitesInfo })
    if (throwError === true) {
      throw e
    } else if (e.name === 'CredentialsProviderError') {
      let message = 'Your AWS login credentials may have expired. Update your credentials or try refreshing with:\n\naws sso login'
      if (globalOptions.ssoProfile !== undefined) {
        message += ' --profile ' + globalOptions.ssoProfile
      }
      message += '\n'
      process.stderr.write(message)
      process.exit(2) // eslint-disable-line no-process-exit
    } else {
      process.stderr.write(e.message + '\n')
      process.exit(3) // eslint-disable-line no-process-exit
    }
  }
  await checkAndUpdateSitesInfo({ origSitesInfo, sitesInfo })
}

const checkAndUpdateSitesInfo = async ({ origSitesInfo, sitesInfo }) => {
  if (!isEqual(origSitesInfo, sitesInfo)) {
    const sitesInfoContent = JSON.stringify(sitesInfo, null, '  ')
    await fs.writeFile(SITES_INFO_PATH, sitesInfoContent, { encoding : 'utf8' })
  }
}

export { cloudsite }
