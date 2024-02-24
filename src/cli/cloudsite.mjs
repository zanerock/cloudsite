import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'

import { cliSpec } from './cli-spec'
import { handleConfiguration } from './lib/handle-configuration'
import { handleCreate } from './lib/handle-create'

const cloudsite = async () => {
  const mainOptions = commandLineArgs(cliSpec.mainOptions, { stopAtFirstUnknown : true })
  const argv = mainOptions._unknown || []

  const { command, quiet } = mainOptions
  const throwError = mainOptions['throw-error']

  const globalOptionsPath = fsPath.join(process.env.HOME, '.config', 'cloudsite', 'global-options.json')
  let globalOptions
  try {
    const globalOptionsContent = await fs.readFile(globalOptionsPath, { encoding : 'utf8' })
    globalOptions = JSON.parse(globalOptionsContent)
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
    // otherwise, it's fine, there just are no options
    globalOptions = {}
  }

  try {
    switch (command) {
      case 'configuration':
        await handleConfiguration({ argv, cliSpec, globalOptions }); break
      case 'create':
        await handleCreate({ argv, globalOptions }); break
      default:
        process.stderr.write('Uknown command: ' + command + '\n\n')
      // TODO: handleHelp() (abstriact from cloudcraft)
    }
  } catch (e) {
    if (throwError === true) {
      throw e
    } else {
      process.stderr.write(e.message + '\n')
      process.exit(2)
    }
  }
}

export { cloudsite }
