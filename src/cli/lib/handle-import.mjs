import { stat as fileStat } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'

import { CloudFormationClient } from '@aws-sdk/client-cloudformation'

import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { cliSpec } from '../constants'
import { doImportSite } from '../../lib/actions/import-site'
import { doImportSSO } from '../../lib/actions/import-sso'
import { getCredentials } from '../../lib/shared/authentication-lib'
import { getOptionsSpec } from './get-options-spec'
import { getStacksBy } from './get-stacks-by'
import { processSourceType } from './process-source-type'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleImport = async ({ argv, db, globalOptions }) => {
  // gather parameter values
  const importOptionsSpec = getOptionsSpec({ cliSpec, name : 'import' })
  const importOptions = commandLineArgs(importOptionsSpec, { argv })
  const {
    'no-sso': noSSO,
    refresh,
    region
  } = importOptions
  const { 'apex-domain': apexDomain, 'source-path': sourcePath } = importOptions

  // verify input parameters form correct
  if (region === undefined) {
    throw new Error("You must specify the '--region' parameter.\n")
  }

  const updateSites = apexDomain !== undefined
    ? [{ apexDomain, sourcePath }]
    : []

  const credentials = getCredentials(globalOptions)
  const cloudFormationClient = new CloudFormationClient({ credentials, region })

  if (updateSites.length === 0) { // then we find the mall
    updateSites.push(...(await getStacksBy({ cloudFormationClient, region, testFunc : isCloudsiteAppStack })))
  }

  const sitesInfo = db.sites

  let i = 0
  for (let { apexDomain, sourcePath, sourceType } of updateSites) {
    if (sitesInfo[apexDomain] !== undefined && refresh !== true) {
      throw new Error(`Domain '${apexDomain}' is already in the sites DB. To update/refresh the values, use the '--refresh' option.`)
    }

    while (sourcePath === undefined) {
      const interrogationBundle = {
        actions : [
          {
            prompt    : `Enter the source path for '${apexDomain}:'`,
            parameter : 'SOURCE_PATH'
          }
        ]
      }

      const questioner = new Questioner({ interrogationBundle, output : progressLogger })
      await questioner.question()
      sourcePath = resolvePath(questioner.get('SOURCE_PATH'))
      const stat = await fileStat(sourcePath)
      if (!stat.isDirectory()) {
        throw new Error(`Source path '${sourcePath}' is not a directory.`)
      }

      sourceType = processSourceType({ sourcePath, sourceType })
    }
    updateSites[i].sourcePath = sourcePath
    updateSites[i].sourceType = sourceType
    i += 1
  }

  for (let { apexDomain, region, sourcePath, sourceType, stackID, stackName } of updateSites) {
    if (stackID === undefined) {
      // then apexDomain must be defined
      const testFunc = ({ Key : key, Value : value }) => key === 'site' && value === apexDomain
      const stackData =
        (await getStacksBy({ cloudFormationClient, region, testFunc }))
      if (stackData === undefined) {
        throw new Error(`Could not locate data for site with apex domain: ${apexDomain}`)
      } // else, good to go

      ({ stackID, stackName } = stackData)
    }

    const dbEntry =
      await doImportSite({
        apexDomain,
        db,
        globalOptions,
        region,
        sourcePath,
        sourceType,
        stackName
      })
    progressLogger.write(`Updating DB entry for '${apexDomain}'...\n`)
    sitesInfo[apexDomain] = dbEntry
  }

  if (noSSO !== true) {
    // now, actually do the import
    await doImportSSO({ credentials, db })
  }

  return { success : true, userMessage : 'Imported data.' }
}

const isCloudsiteAppStack = ({ Tags : tags }) =>
  tags.some(({ Key: key, Value: value }) => key === 'application' && value === 'Cloudsite')

export { handleImport }
