import commandLineArgs from 'command-line-args'

import { handleConfigurationInitialize } from './configuration/handle-configuration-initialize'
import { handleConfigurationShow } from './configuration/handle-configuration-show'

const handleConfiguration = async ({ argv, cliSpec, globalOptions }) => {
  const configurationCLISpec = cliSpec.commands.find(({ name }) => name === 'configuration')
  const configurationOptionsSpec = configurationCLISpec.arguments
  const configurationOptions = commandLineArgs(configurationOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { subcommand } = configurationOptions
  argv = configurationOptions._unknown || []

  switch (subcommand) {
    case 'initialize':
      await handleConfigurationInitialize({ argv, configurationCLISpec, globalOptions }); break
    case 'show':
      await handleConfigurationShow({ argv, configurationCLISpec, globalOptions }); break
    default:
      throw new Error('Unknown configuration command: ' + subcommand)
  }
}

export { handleConfiguration }
