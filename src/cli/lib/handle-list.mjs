import commandLineArgs from 'command-line-args'
import yaml from 'js-yaml'
import { jsonToPlainText, Options } from 'json-to-plain-text'
import pick from 'lodash/pick'

import { cliSpec } from '../constants'

const handleList = ({ argv, sitesInfo }) => {
  const listOptionsSpec = cliSpec.commands.find(({ name }) => name === 'list').arguments
  const listOptions = commandLineArgs(listOptionsSpec, { argv })
  const allFields = listOptions['all-fields']
  const { format } = listOptions

  const sitesInfoArray = Object.values(sitesInfo)
  const output = allFields === true
    ? sitesInfoArray
    : sitesInfoArray.map((siteInfo) => {
      const trimmed = pick(siteInfo, ['apexDomain', 'region', 'sourcePath'])
      trimmed.plugins = Object.keys(siteInfo.pluginSettings)
      return trimmed
    })

  if (format === 'json') {
    process.stdout.write(JSON.stringify(output, null, '  ') + '\n')
  } else if (format === 'yaml') {
    process.stdout.write(yaml.dump(output))
  } else {
    const options = { color : format !== 'text' }
    const text = jsonToPlainText(output, options)

    process.stdout.write(text + '\n')
  }
}

export { handleList }
