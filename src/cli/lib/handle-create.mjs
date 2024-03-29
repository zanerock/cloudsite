import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { awsS3TABucketNameRE, awsS3TABucketNameREString } from 'regex-repo'
import { Questioner } from 'question-and-answer'

import { checkAuthentication } from './check-authentication'
import { cliSpec } from '../constants'
import { create } from '../../lib/actions/create'
import { getOptionsSpec } from './get-options-spec'
import * as optionsLib from './options'
import * as plugins from '../../lib/plugins'
import { processSourceType } from './process-source-type'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleCreate = async ({ argv, db }) => {
  await checkAuthentication({ db })

  const createOptionsSpec = getOptionsSpec({ cliSpec, name: 'create' })
  const createOptions = commandLineArgs(createOptionsSpec, { argv })
  // action behavior options
  const noDeleteOnFailure = createOptions['no-delete-on-failure']
  // siteInfo options
  let apexDomain = createOptions['apex-domain']
  const bucketName = createOptions['bucket-name']
  const noBuild = createOptions['no-build']
  const noInteractive = createOptions['no-interactive']
  // switch any relative sourcePath to absolute
  let sourcePath = createOptions['source-path']
  let sourceType = createOptions['source-type']
  const stackName = createOptions['stack-name']
  const options = optionsLib.mapRawOptions(createOptions.option)

  if (noInteractive !== true) {
    const interrogationBundle = { actions : [{ review : 'questions' }] }
    if (sourcePath === undefined) { // doing these in reverse order because we're 'unshifting' to the front
      interrogationBundle.actions.unshift({ prompt : 'Source path:', parameter : 'sourcePath' })
    }
    if (apexDomain === undefined) {
      interrogationBundle.actions.unshift({ prompt : 'Apex domain:', parameter : 'apexDomain' })
    }
    if (interrogationBundle.actions.length > 1) {
      const questioner = new Questioner({ interrogationBundle, output : progressLogger })
      await questioner.question();

      ({ apexDomain = apexDomain, sourcePath = sourcePath } = questioner.values)
    }
  }
  sourcePath = fsPath.resolve(sourcePath)

  // don't use 'getSiteInfo', it errors out on blanks
  const siteInfo = db.sites[apexDomain] || { apexDomain, bucketName, sourcePath, sourceType }
  siteInfo.region = createOptions.region || siteInfo.region || 'us-east-1'
  if (stackName !== undefined) {
    siteInfo.stackName = stackName
  }

  db.sites[apexDomain] = siteInfo

  // verify the parameters/options
  for (const [value, option] of [[apexDomain, 'apex-domain'], [sourcePath, 'source-path']]) {
    if (value === undefined) {
      throw new Error(`Missing required '${option}' option.`, { exitCode: 2 })
      // TODO: handleHelp({ argv : ['create'] })
    }
  }
  // TODO: verify apex domain matches apex domain RE

  sourceType = processSourceType({ sourcePath, sourceType })

  if (bucketName !== undefined && !awsS3TABucketNameRE.test(bucketName)) {
    // we're not using Transfer Accelerated ATM, but we might want to at some point.
    throw new Error(`Invalid bucket name. Must be valid AWS S3 Transfer Accelerated bucket name matching: ${awsS3TABucketNameREString}`, { exitCode: 2 })
  }

  if (options.length === 0 && noInteractive !== true) {
    for (const [plugin, { config }] of Object.entries(plugins)) {
      const { description, name, options: configOptions } = config
      const interrogationBundle = {
        actions : [
          { statement : `<em>${name}<rst> plugin: ${description}` },
          { prompt : `Enable '<em>${name}<rst>' plugin?`, options : ['yes', 'no'], default : 'no', parameter : 'enable' }
        ]
      }
      const questioner = new Questioner({ interrogationBundle, output : progressLogger })
      await questioner.question()
      const enable = questioner.getResult('enable').value === 'yes'

      if (enable === true) {
        const interrogationBundle = { actions : [] }
        for (const [parameter, configSpec] of Object.entries(configOptions)) {
          const { default: defaultValue, description, invalidMessage, matches, required, type = 'string' } = configSpec
          const questionSpec = {
            default          : defaultValue,
            invalidMessage,
            prompt           : `<em>${parameter}<rst>: ${description}\nValue?`,
            parameter,
            requireSomething : required,
            requireMatch     : matches,
            type
          }
          interrogationBundle.actions.push(questionSpec)
        }
        const questioner = new Questioner({ interrogationBundle, output : progressLogger })
        await questioner.question()
        options.push(...questioner.results.map(({ parameter, value }) => ({ name : `${plugin}.${parameter}`, value })))
      }
    }
  }

  optionsLib.updatePluginSettings({ options, siteInfo })

  // update siteInfo in case these were manually specified
  for (const [value, field] of [[bucketName, 'bucketName'], [sourcePath, 'sourcePath'], [sourceType, 'sourceType']]) {
    if (value !== undefined) {
      siteInfo[field] = value
    }
  }

  const stackCreated = await create({ db, noBuild, noDeleteOnFailure, siteInfo })

  if (stackCreated === true) {
    return { success: true, userMessage: `Created stack '${stackName}'.` }
  }
  else {
    return { success: false, userMessage: `Failed to create stack '${stackName}'.` }
  }
}

export { handleCreate }
