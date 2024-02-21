import commandLineArgs from 'command-line-args'

import { cliSpec } from './cli-spec'
import { handleCreate } from './lib/handle-create'

const cloudsite = async () => {
  const mainOptions = commandLineArgs(cliSpec.mainOptions, { stopAtFirstUnknown : true })
  const argv = mainOptions._unknown || []

  const { command, quiet } = mainOptions
  const throwError = mainOptions['throw-error']

  try {
    switch (command) {
    case 'create':
      await handleCreate({ argv }); break
    default:
      process.stderr.write('Uknown command: ' + command + '\n\n')
      // TODO: handleHelp() (abstriact from cloudcraft)
    }
  }
  catch (e) {
    if (throwError === true) {
      throw e
    }
    else {
      process.stderr.write(e.message + '\n')
      process.exit(2)
    }
  }
}

export { cloudsite }