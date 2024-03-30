import commandLineArgs from 'command-line-args'

import { cliSpec } from '../../constants'
import { getOptionsSpec } from '../get-options-spec'
import { getSiteInfo } from '../get-site-info'
import * as optionsLib from '../options'
import { smartConvert } from '../smart-convert'

const handlePluginSettingsSet = async ({ argv, db }) => {
  const myOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'plugin-settings')
    .commands.find(({ name }) => name === 'set')
    .arguments || []
  const pluginSettingsSetOptionsSpec = getOptionsSpec({ optionsSpec : myOptionsSpec })
  const pluginSettingsSetOptions = commandLineArgs(pluginSettingsSetOptionsSpec, { argv })
  const apexDomain = pluginSettingsSetOptions['apex-domain']
  const options = optionsLib.mapRawOptions(pluginSettingsSetOptions.option)

  const { confirmed, delete: doDelete, name, value } = pluginSettingsSetOptions

  // validate options
  const siteInfo = getSiteInfo({ apexDomain, db })

  if (doDelete === true && name === undefined && options.length === 0) {
    throw new Error("You must specify a '--name' or at least one '--option' when '--delete' is set.\n")
  } else if (name !== undefined && (value !== undefined || doDelete === true)) {
    options.push({ name, value : smartConvert(value) }) // the 'option' values are already converted
  } else if (name !== undefined && value === undefined) { // but delete is not set (checked above)
    throw new Error("You must specify a '--value' or '--delete' when '--name' is set.\n")
  } else if (name === undefined && value !== undefined) {
    throw new Error("You must specify a '--name' when '--value' is set.\n")
  }

  if (doDelete !== true && options.length === 0) {
    throw new Error("Invalid options; specify '--name'+'--value', '--delete'/'--name', or one or more '--option' options.\n")
  }

  // take actions and update the options
  if (siteInfo.plugins === undefined) {
    siteInfo.plugins = {}
  }
  optionsLib.updatePluginSettings({ confirmed, doDelete, options, siteInfo })

  return { success : true, userMessage : `Plugin options updated for ${apexDomain}.` }
}

export { handlePluginSettingsSet }
