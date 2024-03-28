import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { handleConfigurationInitialize } from './configuration/handle-configuration-initialize'
import { handleConfigurationShow } from './configuration/handle-configuration-show'

const handleConfiguration = async ({ argv, db }) => {
  const configurationCLISpec = getOptionsSpec({ cliSpec, name: 'configuration' })
  const configurationOptionsSpec = configurationCLISpec.arguments
  const configurationOptions = commandLineArgs(configurationOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { subcommand } = configurationOptions
  argv = configurationOptions._unknown || []

  switch (subcommand) {
    case 'initialize':
      await handleConfigurationInitialize({ argv, db }); break
    case 'show':
      await handleConfigurationShow({ argv, db }); break
    default:
      throw new Error('Unknown configuration command: ' + subcommand)
  }
}

export { handleConfiguration }
