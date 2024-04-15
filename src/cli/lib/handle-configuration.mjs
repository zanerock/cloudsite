import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { handleConfigurationLocalSetup } from './configuration/handle-configuration-local-setup'
import { handleConfigurationShow } from './configuration/handle-configuration-show'
import { handleConfigurationSSOSetup } from './configuration/handle-configuration-sso-setup'

const handleConfiguration = async ({ argv, db }) => {
  const configurationOptionsSpec = getOptionsSpec({ cliSpec, name : 'configuration' })
  const configurationOptions = commandLineArgs(configurationOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { subcommand } = configurationOptions
  argv = configurationOptions._unknown || []

  switch (subcommand) {
    case 'local-setup':
      return await handleConfigurationLocalSetup({ argv, db })
    case 'show':
      return await handleConfigurationShow({ argv, db })
    case 'sso-setup':
      return await handleConfigurationSSOSetup({ argv, db })
    default:
      throw new Error('Unknown configuration command: ' + subcommand)
  }
}

export { handleConfiguration }
