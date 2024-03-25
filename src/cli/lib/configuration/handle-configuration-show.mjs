import commandLineArgs from 'command-line-args'

import { cliSpec } from '../../constants'
import { progressLogger } from '../../../lib/shared/progress-logger'

const handleConfigurationShow = async ({ argv, db }) => {
  const showConfigurationCLISpec = cliSpec
    .commands.find(({ name }) => name === 'configuration')
    .commands.find(({ name }) => name === 'show')
  const showConfigurationOptionsSpec = showConfigurationCLISpec.arguments
  const showConfigurationOptions = commandLineArgs(showConfigurationOptionsSpec, { argv })
  const { format } = showConfigurationOptions

  const accountSettings = db.account.settings || {}
  progressLogger.write(accountSettings, '', { format })
}

export { handleConfigurationShow }
