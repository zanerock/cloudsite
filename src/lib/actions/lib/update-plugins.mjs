import * as plugins from '../../plugins'

const updatePlugins = async ({ credentials, siteInfo }) => {
  const { apexDomain, plugins : pluginsData } = siteInfo
  const updates = []

  for (const [pluginKey, settings] of Object.entries(pluginData)) {
    const plugin = plugins[pluginKey]
    if (plugin === undefined) {
      throw new Error(`Unknown plugin found in '${apexDomain}' during update.`)
    }

    const { updateHandler } = plugin
    updates.push(updateHandler?.({ credentials, pluginData, siteInfo }))
  }

  await Promise.all(updates)
}

export { updatePlugins }
