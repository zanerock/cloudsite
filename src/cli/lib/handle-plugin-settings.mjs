import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { errorOut } from './error-out'
import { getSiteInfo } from './get-site-info'
import { getValueContainerAndKey } from './get-value-container-and-key'
import * as plugins from '../../lib/plugins'
import { smartConvert } from './smart-convert'

const handlePluginSettings = async ({ argv, sitesInfo }) => {
  const setOptionOptionsSpec = cliSpec.commands.find(({ name }) => name === 'plugin-settings').arguments
  const setOptionOptions = commandLineArgs(setOptionOptionsSpec, { argv })
  const apexDomain = setOptionOptions['apex-domain']
  const options = (setOptionOptions.option || []).map((spec) => {
    let [name, value] = spec.split(/(?!\\):/)
    value = value?.replaceAll(/\\:/g, ':')

    return { name, value }
  })
  const { delete: doDelete, name, value } = setOptionOptions

  // validate options
  const siteInfo = getSiteInfo({ apexDomain, sitesInfo })

  if (doDelete === true && (value !== undefined || options.length > 0)) {
    errorOut("The '--delete' option is incompatible with the '--value' and --name-value options.\n")
  } else if (doDelete === true && name === undefined) {
    errorOut("You must specify a '--name' when '--delete' is set.\n")
  } else if (doDelete !== true) {
    if (name !== undefined && value !== undefined) {
      options.push({ name, value })
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
    for (const { name, value } of options) {
      const [option] = name.split('.')

      if (!(option in plugins)) {
        errorOut(`No such option '${option}'; use one of: ${Object.keys(plugins).join(', ')}.\n`)
      }

      const optionsSpec = plugins[option].config?.options

      const wrappedSpec = { [option] : optionsSpec } // so our option spec matches our path
      const smartValue = smartConvert(value)
      const { valueContainer, valueKey } =
        getValueContainerAndKey({ path : name, rootContainer : pluginSettings, spec : wrappedSpec, value : smartValue })
      valueContainer[valueKey] = smartValue
    }
  }

  siteInfo.pluginSettings = pluginSettings
}

export { handlePluginSettings }
