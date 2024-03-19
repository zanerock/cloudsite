import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { doImport } from '../../lib/actions/import'
import { errorOut } from './error-out'

const handleImport = async ({ argv, globalOptions, sitesInfo }) => {
  const importOptionsSpec = cliSpec.commands.find(({ name }) => name === 'import').arguments
  const importOptions = commandLineArgs(importOptionsSpec, { argv })
  const domainAndStack = importOptions['domain-and-stack']
  const { region } = importOptions

  if (domainAndStack?.length !== 2) {
    errorOut(`Unexpected number of positional arguments, expect 2 (domain and stack name), but got ${domainAndStack?.length || '0'}.\n`)
  }
  if (region === undefined) {
    errorOut("You must specify the '--region' parameter.\n")
  }

  let domain, stack
  for (const domainOrStack of domainAndStack) {
    if (domainOrStack.match(/\./)) {
      domain = domainOrStack
    } else if (domainOrStack.match(/^[a-z][a-z0-9-]*$/i)) {
      stack = domainOrStack
    }
  }
  if (domain === undefined) {
    errorOut(`Could not determine domain name from arguments (${domainAndStack}).\n`)
  }
  if (stack === undefined) {
    errorOut(`Could not determine stack name from arguments (${domainAndStack}).\n`)
  }

  const dbEntry = await doImport({ domain, globalOptions, region, stack })
  console.log('dbEntry:', dbEntry) // DEBUG
  // sitesInfo[domain] = dbEntry
}

export { handleImport }
