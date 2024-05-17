import commandLineArgs from 'command-line-args'

import { checkFormat } from './check-format'
import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'

const handleDetail = ({ argv, db }) => {
  const detailOptionsSpec = getOptionsSpec({ cliSpec, name : 'detail' })
  const detailOptions = commandLineArgs(detailOptionsSpec, { argv })
  const apexDomain = detailOptions['apex-domain']
  const { format } = detailOptions

  checkFormat(format)

  const output = getSiteInfo({ apexDomain, db })

  return { success : true, data : output }
}

export { handleDetail }
