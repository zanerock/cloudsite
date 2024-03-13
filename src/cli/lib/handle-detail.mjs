import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { errorOut } from './error-out'
import { formatOutput } from './format-output'
import { getSiteInfo } from './get-site-info'

const handleDetail = ({ argv, sitesInfo }) => {
  const detailOptionsSpec = cliSpec.commands.find(({ name }) => name === 'detail').arguments
  const detailOptions = commandLineArgs(detailOptionsSpec, { argv })
  const apexDomain = detailOptions['apex-domain']
  const { format } = detailOptions

  if (apexDomain === undefined) {
    errorOut('Apex domain must be specified.')
  }

  const output = getSiteInfo({ apexDomain, sitesInfo })

  formatOutput({ output, format })
}

export { handleDetail }
