import commandLineArgs from 'command-line-args'
import pick from 'lodash/pick'

import { checkFormat } from './check-format'
import { cliSpec } from '../constants'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleList = ({ argv, db }) => {
  const listOptionsSpec = cliSpec.commands.find(({ name }) => name === 'list').arguments
  const listOptions = commandLineArgs(listOptionsSpec, { argv })
  const allFields = listOptions['all-fields']
  const { format } = listOptions

  checkFormat(format)

  const sitesInfoArray = Object.values(db.sites)
  const output = allFields === true
    ? sitesInfoArray
    : sitesInfoArray.map((siteInfo) => {
      const trimmed = pick(siteInfo, ['apexDomain', 'region', 'sourcePath'])
      trimmed.plugins = Object.keys(siteInfo.plugins)
      return trimmed
    })

  progressLogger.write(output, '', { format })
}

export { handleList }
