import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { handleConfigurationSetupLocal } from './configuration/handle-configuration-setup-local'
import { handleConfigurationShow } from './configuration/handle-configuration-show'
import { handleConfigurationSetupSSO } from './configuration/handle-configuration-setup-sso'

const handleConfiguration = async ({ argv, db }) => {
  const configurationOptionsSpec = getOptionsSpec({ cliSpec, name : 'configuration' })
  const configurationOptions = commandLineArgs(configurationOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { subcommand } = configurationOptions
  argv = configurationOptions._unknown || []

  switch (subcommand) {
    case 'setup-local':
      return await handleConfigurationSetupLocal({ argv, db })
    case 'show':
      return await handleConfigurationShow({ argv, db })
    case 'setup-sso':
      return await handleConfigurationSetupSSO({ argv, db })
    default:
      throw new Error('Unknown configuration command: ' + subcommand)
  }
}

export { handleConfiguration }
