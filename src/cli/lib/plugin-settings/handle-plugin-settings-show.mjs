import commandLineArgs from 'command-line-args'

import { cliSpec } from '../../constants'
import { getOptionsSpec } from '../get-options-spec'

const handlePluginSettingsShow = async ({ argv, db }) => {
  const myOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'plugin-settings')
    .commands.find(({ name }) => name === 'show')
    .arguments || []
  const handlePluginSettingsShowOptionsSpec = getOptionsSpec({ optionsSpec : myOptionsSpec })
  const handlePluginSettingsShowOptions = commandLineArgs(handlePluginSettingsShowOptionsSpec, { argv })
  const apexDomain = handlePluginSettingsShowOptions['apex-domain']

  const settings = db.sites[apexDomain].plugins

  return { success : true, data : settings }
}

export { handlePluginSettingsShow }
