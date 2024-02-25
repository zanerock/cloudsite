import commandLineArgs from 'command-line-args'

// eslint-disable-next-line node/no-missing-import
import { handleConfigurationInitialize } from './configuration/handle-configuration-initialize'
// eslint-disable-next-line node/no-missing-import
import { handleConfigurationShow } from './configuration/handle-configuration-show'

const handleConfiguration = async ({ argv, cliSpec, globalOptions }) => {
  const configurationCLISpec = cliSpec.commands.find(({ name }) => name === 'configuration')
  const configurationOptionsSpec = configurationCLISpec.arguments
  const configurationOptions = commandLineArgs(configurationOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { command } = configurationOptions
  argv = configurationOptions._unknown || []

  switch (command) {
    case 'initialize':
      await handleConfigurationInitialize({ argv, configurationCLISpec, globalOptions }); break
    case 'show':
      await handleConfigurationShow({ argv, configurationCLISpec, globalOptions }); break
    default:
      throw new Error('Unknown configuration command: ' + command)
  }
}

export { handleConfiguration }
