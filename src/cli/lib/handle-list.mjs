import commandLineArgs from 'command-line-args'
import pick from 'lodash/pick'

import { cliSpec } from '../constants'
import { formatOutput } from './format-output'

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

  formatOutput({ output, format })
}

export { handleList }
