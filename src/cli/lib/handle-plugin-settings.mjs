import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { handlePluginSettingsSet } from './plugin-settings/handle-plugin-settings-set'
import { handlePluginSettingsShow } from './plugin-settings/handle-plugin-settings-show'

const handlePluginSettings = async ({ argv, db }) => {
  const setOptionOptionsSpec = getOptionsSpec({ cliSpec, name: 'plugin-settings' })
  const setOptionOptions = commandLineArgs(setOptionOptionsSpec, { argv, stopAtFirstUnknown: true })
  const { subcommand } = setOptionOptions
  argv = setOptionOptions._unknown || []

  switch (subcommand) {
    case 'set':
      return await handlePluginSettingsSet({ argv, db }); break
    case 'show':
      return await handlePluginSettingsShow({ argv, db }); break
    default:
      throw new Error('Unknown plugin settings command: ' + subcommand)
  }
}

export { handlePluginSettings }
