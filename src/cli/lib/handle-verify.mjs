import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { formatOutput } from './format-output'
import { getSiteInfo } from './get-site-info'
import { verify } from '../../lib/actions/verify'

const handleVerify = async ({ argv, sitesInfo, globalOptions }) => {
  const verifyOptionsSpec = cliSpec.commands.find(({ name }) => name === 'verify').arguments
  const verifyOptions = commandLineArgs(verifyOptionsSpec, { argv })
  const { format } = verifyOptions
  const apexDomain = verifyOptions['apex-domain']
  const checkContent = verifyOptions['check-content']
  const checkSiteUp = verifyOptions['check-site-up']
  const checkStack = verifyOptions['check-stack']

  const siteInfo = getSiteInfo({ apexDomain, sitesInfo })

  const results =
    await verify({ checkContent, checkSiteUp, checkStack, globalOptions, progressLogger : process.stdout, siteInfo })
  const summaryStatus = results.reduce((acc, { status : s }) => {
    if (s === 'error') { return 'error' } else if (s === 'failed') { return 'failed' } else { return acc }
  }, 'success')

  const output = { 'overall status' : summaryStatus, checks : results }
  formatOutput({ output, format })
}

export { handleVerify }
