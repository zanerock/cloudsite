import commandLineArgs from 'command-line-args'

import { checkFormat } from './check-format'
import { cliSpec } from '../constants'
import { errorOut } from './error-out'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleDetail = ({ argv, db }) => {
  const detailOptionsSpec = getOptionsSpec({ cliSpec, name: 'detail' })
  const detailOptions = commandLineArgs(detailOptionsSpec, { argv })
  const apexDomain = detailOptions['apex-domain']
  const { format } = detailOptions

  if (apexDomain === undefined) {
    errorOut('Apex domain must be specified.')
  }

  checkFormat(format)

  const output = getSiteInfo({ apexDomain, db })

  return { success: true, data: output }
}

export { handleDetail }
