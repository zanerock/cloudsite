import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { errorOut } from './error-out'
import { getSiteInfo } from './get-site-info'
import { getValueContainerAndKey } from './get-value-container-and-key'
import * as optionsLib from './options'
import { smartConvert } from './smart-convert'

const handlePluginSettings = async ({ argv, db }) => {
  const setOptionOptionsSpec = cliSpec.commands.find(({ name }) => name === 'plugin-settings').arguments
  const setOptionOptions = commandLineArgs(setOptionOptionsSpec, { argv })
  const apexDomain = setOptionOptions['apex-domain']
  const options = optionsLib.mapRawOptions(setOptionOptions.option)

  const { delete: doDelete, name, value } = setOptionOptions

  // validate options
  const siteInfo = getSiteInfo({ apexDomain, db })

  if (doDelete === true && name === undefined && options.length === 0) {
    errorOut("You must specify a '--name' or at least one '--option' when '--delete' is set.\n")
  } else if (name !== undefined && (value !== undefined || doDelete === true)) {
    options.push({ name, value : smartConvert(value) }) // the 'option' values are already converted
  } else if (name !== undefined && value === undefined) { // but delete is not set (checked above)
    errorOut("You must specify a '--value' or '--delete' when '--name' is set.\n")
  } else if (name === undefined && value !== undefined) {
    errorOut("You must specify a '--name' when '--value' is set.\n")
  }

  if (doDelete !== true && options.length === 0) {
    errorOut("Invalid options; specify '--name'+'--value', '--delete'/'--name', or one or more '--option' options.\n")
  }

  // take actions and update the options
  if (siteInfo.plugins === undefined) {
    siteInfo.plugins = {}
  }
  optionsLib.updatePluginSettings({ doDelete, options, siteInfo })
}

export { handlePluginSettings }
