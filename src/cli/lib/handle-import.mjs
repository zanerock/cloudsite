import { resolve as resolvePath } from 'node:path'

import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { doImport } from '../../lib/actions/import'
import { getOptionsSpec } from './get-options-spec'
import { processSourceType } from './process-source-type'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleImport = async ({ argv, db }) => {
  // gather parameter values
  const importOptionsSpec = getOptionsSpec({ cliSpec, name : 'import' })
  const importOptions = commandLineArgs(importOptionsSpec, { argv })
  const commonLogsBucket = importOptions['common-logs-bucket']
  const domainAndStack = importOptions['domain-and-stack']
  const { refresh, region } = importOptions
  let sourcePath = importOptions['source-path']

  // verify input parameters form correct
  if (sourcePath === undefined) {
    throw new Error("Must define '--source-path'.")
  }

  sourcePath = resolvePath(sourcePath)
  const sourceType = processSourceType({ sourcePath, sourceType : importOptions['source-type'] })

  if (domainAndStack?.length !== 2) {
    throw new Error(`Unexpected number of positional arguments, expect 2 (domain and stack name), but got ${domainAndStack?.length || '0'}.\n`)
  }
  if (region === undefined) {
    throw new Error("You must specify the '--region' parameter.\n")
  }
  if (sourcePath === undefined) {
    throw new Error("You must specify the '--source-path' parameter.\n")
  }

  let domain, stack
  for (const domainOrStack of domainAndStack) {
    if (domainOrStack.match(/\./)) {
      domain = domainOrStack
    } else if (domainOrStack.match(/^[a-z][a-z0-9-]*$/i)) {
      stack = domainOrStack
    }
  }

  const sitesInfo = db.sites

  if (sitesInfo[domain] !== undefined && refresh !== true) {
    throw new Error(`Domain '${domain}' is already in the sites DB. To update/refresh the values, use the '--refresh' option.`)
  }
  if (domain === undefined) {
    throw new Error(`Could not determine domain name from arguments (${domainAndStack}).\n`)
  }
  if (stack === undefined) {
    throw new Error(`Could not determine stack name from arguments (${domainAndStack}).\n`)
  }

  // now, actually do the import
  const dbEntry = await doImport({ commonLogsBucket, db, domain, region, sourcePath, sourceType, stack })
  progressLogger.write(`Updating DB entry for '${domain}'...\n`)
  sitesInfo[domain] = dbEntry

  return { success : true, userMessage : `Imported site '${domain}'.` }
}

export { handleImport }
