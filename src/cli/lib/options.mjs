import { errorOut } from './error-out'
import { getValueContainerAndKey } from './get-value-container-and-key'
import * as plugins from '../../lib/plugins'
import { smartConvert } from './smart-convert'

const mapRawOptions = (rawOptions = []) =>
  rawOptions.map((spec) => {
    let [name, value] = spec.split(/(?!\\):/)
    value = value?.replaceAll(/\\:/g, ':') || 'true'
    value = smartConvert(value)

    return { name, value }
  })

const updatePluginSettings = ({ options, siteInfo }) => {
  const { pluginSettings = {} } = siteInfo

  for (const { name, value } of options) {
    console.log('processing option:', name, '/', value) // DEBUG
    const [option] = name.split('.')

    if (!(option in plugins)) {
      errorOut(`No such plugin '${option}'; use one of: ${Object.keys(plugins).join(', ')}.\n`)
    }

    const optionsSpec = plugins[option].config?.options

    const wrappedSpec = { [option] : optionsSpec } // so our option spec matches our path
    const { valueContainer, valueKey } =
      getValueContainerAndKey({ path : name, rootContainer : pluginSettings, spec : wrappedSpec, value })
    valueContainer[valueKey] = value
  }

  console.log('pluginSettings:', pluginSettings) // DEBUG
  siteInfo.pluginSettings = pluginSettings
}

export { mapRawOptions, updatePluginSettings }
