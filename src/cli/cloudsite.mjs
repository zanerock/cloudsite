import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'

import { cliSpec, GLOBAL_OPTIONS_PATH, SITES_INFO_PATH } from './constants'
import { handleConfiguration } from './lib/handle-configuration'
import { handleCreate } from './lib/handle-create'

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

  try {
    switch (command) {
      case 'configuration':
        await handleConfiguration({ argv, cliSpec, globalOptions }); break
      case 'create':
        await handleCreate({ argv, globalOptions, sitesInfo }); break
      default:
        process.stderr.write('Uknown command: ' + command + '\n\n')
      // TODO: handleHelp() (abstriact from cloudcraft)
    }
  } catch (e) {
    if (throwError === true) {
      throw e
    } else {
      process.stderr.write(e.message + '\n')
      process.exit(2) // eslint-disable-line no-process-exit
    }
  }
}

export { cloudsite }
