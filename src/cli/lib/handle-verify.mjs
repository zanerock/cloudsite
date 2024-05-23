import commandLineArgs from 'command-line-args'

import { checkFormat } from './check-format'
import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { getSiteInfo } from './get-site-info'
import { verify } from '../../lib/actions/verify'

const handleVerify = async ({ argv, db, globalOptions }) => {
  const verifyOptionsSpec = getOptionsSpec({ cliSpec, name : 'verify' })
  const verifyOptions = commandLineArgs(verifyOptionsSpec, { argv })
  const { format } = verifyOptions
  const apexDomain = verifyOptions['apex-domain']
  const checkContent = verifyOptions['check-content']
  const checkSiteUp = verifyOptions['check-site-up']
  const checkStack = verifyOptions['check-stack']

  checkFormat(format)

  const siteInfo = getSiteInfo({ apexDomain, db })

  const results =
    await verify({ checkContent, checkSiteUp, checkStack, db, globalOptions, siteInfo })
  const summaryStatus = results.reduce((acc, { status : s }) => {
    if (s === 'error') { return 'error' } else if (s === 'failed') { return 'failed' } else { return acc }
  }, 'success')

  const output = { 'overall status' : summaryStatus, checks : results }

  return { data : output }
}

export { handleVerify }
