import commandLineArgs from 'command-line-args'
import pick from 'lodash/pick'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'

const handleList = ({ argv, db }) => {
  const listOptionsSpec = getOptionsSpec({ cliSpec, name : 'list' })
  const listOptions = commandLineArgs(listOptionsSpec, { argv })
  const allFields = listOptions['all-fields']

  const sitesInfoArray = Object.values(db.sites)
  const output = allFields === true
    ? sitesInfoArray
    : sitesInfoArray.map((siteInfo) => {
      const trimmed = pick(siteInfo, ['apexDomain', 'region', 'sourcePath'])
      trimmed.plugins = Object.keys(siteInfo.plugins || {})
      return trimmed
    })

  return { data : output, success : true }
}

export { handleList }
