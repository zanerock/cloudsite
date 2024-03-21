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

const updatePluginSettings = ({ doDelete, options, siteInfo }) => {
  for (const { name, value } of options) {
    const pathBits = name.split('.')
    const pluginName = pathBits.shift()

    const plugin = plugins[pluginName]
    if (plugin === undefined) {
      errorOut(`No such plugin '${pluginName}'; use one of: ${Object.keys(plugins).join(', ')}.\n`)
    }

    const pluginData = siteInfo.plugins[pluginName] || {}
    siteInfo.plugins[pluginName] = pluginData // in case we just created it
    const pluginSettings = siteInfo.plugins[pluginName].settings || {}
    siteInfo.plugins[pluginName].settings = pluginSettings // in case we just created it

    const { valueContainer, valueKey } = getValueContainerAndKey({ path : pathBits, rootContainer : pluginSettings })

    if (doDelete === true && valueKey === undefined) {
      delete siteInfo.plugins[pluginName]
    }
    else if (doDelete === true) {
      delete valueContainer[valueKey]
    } else {
      valueContainer[valueKey] = value
    }

    // delete settings object if empty
    // TODO: this is insufficient if we have a nested option that's empty, we could get something like:
    // { settings: { blah: {} }}
    if (Object.keys(pluginSettings).length === 0) {
      delete siteInfo.plugins[plugin].settings
    }
  }
}

export { mapRawOptions, updatePluginSettings }
