/* import commandLineArgs from 'command-line-args'

import { cliSpec } from '../../constants'
import { getOptionsSpec } from '../get-options-spec' */

const handleConfigurationShow = async ({ /* argv, */ db }) => {
  /*
  const myOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'configuration')
    .commands.find(({ name }) => name === 'show')
    .arguments || []
  const showConfigurationCLISpec = getOptionsSpec({ optionsSpec : myOptionsSpec })
  const showConfigurationOptionsSpec = showConfigurationCLISpec.arguments
  const showConfigurationOptions = commandLineArgs(showConfigurationOptionsSpec, { argv }) */

  const localSettings = db.account.localSettings || {}
  return { success : true, data : localSettings }
}

export { handleConfigurationShow }
