import commandLineArgs from 'command-line-args'
import pick from 'lodash/pick'

import { checkFormat } from './check-format'
import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleList = ({ argv, db }) => {
  const listOptionsSpec = getOptionsSpec({ cliSpec, name: 'list' })
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
