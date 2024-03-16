import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { errorOut } from './error-out'
import { getSiteInfo } from './get-site-info'
import * as optionsLib from './options'
import { smartConvert } from './smart-convert'

const handlePluginSettings = async ({ argv, sitesInfo }) => {
  const setOptionOptionsSpec = cliSpec.commands.find(({ name }) => name === 'plugin-settings').arguments
  const setOptionOptions = commandLineArgs(setOptionOptionsSpec, { argv })
  const apexDomain = setOptionOptions['apex-domain']
  const options = optionsLib.mapRawOptions(setOptionOptions.option)

  const { delete: doDelete, name, value } = setOptionOptions

  // validate options
  const siteInfo = getSiteInfo({ apexDomain, sitesInfo })

  if (doDelete === true && (value !== undefined || options.length > 0)) {
    errorOut("The '--delete' option is incompatible with the '--value' and --name-value options.\n")
  } else if (doDelete === true && name === undefined) {
    errorOut("You must specify a '--name' when '--delete' is set.\n")
  } else if (doDelete !== true) {
    if (name !== undefined && value !== undefined) {
      options.push({ name, value: smartConvert(value) }) // the 'option' values are already converted
    } else if (name !== undefined && value === undefined) {
      errorOut("You must specify a '--value' or '--delete' when '--name' is set.\n")
    } else if (name === undefined && value !== undefined) {
      errorOut("You must specify a '--name' when '--value' is set.\n")
    }
  }

  if (doDelete !== true && options.length === 0) {
    errorOut("Invalid options; specify '--name'+'--value', '--delete'/'--name', or one or more '--option' options.\n")
  }

  // take actions and update the options
  const { pluginSettings = {} } = siteInfo

  if (doDelete === true) {
    const { valueContainer, valueKey } = getValueContainerAndKey({ path : name, rootContainer : pluginSettings })
    delete valueContainer[valueKey]

    if (Object.keys(pluginSettings).length === 0) {
      delete siteInfo.options
    }
  } else {
    optionsLib.updatePluginSettings({ options, siteInfo })
  }

  siteInfo.pluginSettings = pluginSettings
}

export { handlePluginSettings }
