import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { awsS3TABucketNameRE, awsS3TABucketNameREString } from 'regex-repo'
import { Questioner } from 'question-and-answer'

import { ACTION_SETUP_BILLING, cliSpec } from '../constants'
import {
  COST_ALLOCATION_NOT_SET,
  INCLUDE_PLUGIN_DEFAULT_TRUE,
  INCLUDE_PLUGIN_DEFAULT_FALSE,
  INCLUDE_PLUGIN_REQUIRED,
  INCLUDE_PLUGIN_NEVER
} from '../../lib/shared/constants'
import { checkAuthentication } from '../../lib/shared/authentication-lib'
import { create } from '../../lib/actions/create'
import { ensureSSLCertificate } from '../../lib/actions/ensure-ssl-certificate'
import { getOptionsSpec } from './get-options-spec'
import * as optionsLib from './options'
import * as plugins from '../../lib/plugins'
import { processSourceType } from './process-source-type'
import { progressLogger } from '../../lib/shared/progress-logger'

const handleCreate = async ({ argv, db, globalOptions }) => {
  await checkAuthentication({ globalOptions })

  const createOptionsSpec = getOptionsSpec({ cliSpec, name : 'create' })
  const createOptions = commandLineArgs(createOptionsSpec, { argv })
  // action behavior options
  const noDeleteOnFailure = createOptions['no-delete-on-failure']
  // siteInfo options
  let apexDomain = createOptions['apex-domain']
  const noBuild = createOptions['no-build']
  const noInteractive = createOptions['no-interactive']
  const siteBucketName = createOptions['site-bucket-name']
  // switch any relative sourcePath to absolute
  let sourcePath = createOptions['source-path']
  let sourceType = createOptions['source-type']
  let stackName = createOptions['stack-name']
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
  const siteInfo = db.sites[apexDomain] || {
    apexDomain,
    costAllocationStatus : COST_ALLOCATION_NOT_SET,
    siteBucketName,
    sourcePath,
    sourceType
  }
  siteInfo.region = createOptions.region || siteInfo.region || 'us-east-1'
  if (stackName !== undefined) {
    siteInfo.stackName = stackName
  }

  db.sites[apexDomain] = siteInfo

  // verify the parameters/options
  for (const [value, option] of [[apexDomain, 'apex-domain'], [sourcePath, 'source-path']]) {
    if (value === undefined) {
      throw new Error(`Missing required '${option}' option.`, { exitCode : 2 })
      // TODO: handleHelp({ argv : ['create'] })
    }
  }
  // TODO: verify apex domain matches apex domain RE

  sourceType = processSourceType({ sourcePath, sourceType })
  siteInfo.sourceType = sourceType

  if (siteBucketName !== undefined && !awsS3TABucketNameRE.test(siteBucketName)) {
    // we're not using Transfer Accelerated ATM, but we might want to at some point.
    throw new Error(`Invalid bucket name. Must be valid AWS S3 Transfer Accelerated bucket name matching: ${awsS3TABucketNameREString}`, { exitCode : 2 })
  }

  // update site info with data gathered so far
  for (const [value, field] of
    [[siteBucketName, 'siteBucketName'], [sourcePath, 'sourcePath'], [sourceType, 'sourceType']]) {
    if (value !== undefined) {
      siteInfo[field] = value
    }
  }

  await ensureSSLCertificate({ apexDomain, db, globalOptions, siteInfo })

  optionsLib.updatePluginSettings({ options, siteInfo })
  // since we set on site info, we don't need the option anymore (and this avoids double setting later)
  options.splice(0, options.length)

  let firstQuestion = true
  for (const [plugin, { config }] of Object.entries(plugins)) {
    const { description, name, options: configOptions, includePlugin } = config
    let includeDirective = INCLUDE_PLUGIN_DEFAULT_FALSE
    if (includePlugin !== undefined) {
      includeDirective = includePlugin({ siteInfo })
    }

    let enable
    let implicitEnabled = false
    if (siteInfo.plugins[plugin] !== undefined) { // is some option set?
      progressLogger.write(`Enabling ${name} plugin based on settings.\n`)
      enable = true
      implicitEnabled = true
    } else if (includeDirective === INCLUDE_PLUGIN_REQUIRED) {
      progressLogger.write(`Enabling ${name} plugin based on requirements.\n`)
      enable = true
      implicitEnabled = true
    } else if (includeDirective === INCLUDE_PLUGIN_NEVER) {
      progressLogger.write(`Skipping ${name} plugin based on requirements.\n`)
      enable = false
    } else if (noInteractive !== true) {
      if (firstQuestion === false) {
        progressLogger.write('\n')
      }

      const defaultValue = includeDirective === INCLUDE_PLUGIN_DEFAULT_TRUE

      const interrogationBundle = {
        actions : [
          { statement : `\n<em>${name}<rst> plugin: ${description}` },
          {
            prompt    : `Enable '<em>${name}<rst>' plugin?`,
            paramType : 'boolean',
            default   : defaultValue,
            parameter : 'enable'
          }
        ]
      }
      const questioner = new Questioner({ interrogationBundle, output : progressLogger })
      await questioner.question()
      enable = questioner.get('enable')

      firstQuestion = false
    } // end plugin enable determination

    if (enable === true) {
      if (implicitEnabled === true && noInteractive !== true) {
        progressLogger.write(`\n<em>${name}<rst> plugin: ${description}\n`)
      }

      // do we have an option-less plugin?
      if (configOptions === undefined || Object.keys(configOptions).length === 0) {
        options.push({ name : plugin, value : true })
      } else if (noInteractive === true) { // then we set everything to it's default
        for (const [parameter, { default: defaultValue }] of Object.entries(configOptions || {})) {
          if (siteInfo.plugins?.[plugin]?.settings?.[parameter] === undefined) {
            options.push({ name : `${plugin}.${parameter}`, value : defaultValue })
          }
        }
      } else { // we ask
        const interrogationBundle = { actions : [] }
        for (const [parameter, configSpec] of Object.entries(configOptions || {})) {
          const { default: defaultValue, description, invalidMessage, matches, required, paramType = 'string' } = configSpec
          if (siteInfo.plugins?.[plugin]?.settings?.[parameter] === undefined) {
            const questionSpec = {
              default          : defaultValue,
              invalidMessage,
              prompt           : `<em>${parameter}<rst>: ${description}\nValue?`,
              parameter,
              requireSomething : required,
              requireMatch     : matches,
              paramType
            }
            interrogationBundle.actions.push(questionSpec)
          }
          // else, the value is already set
        }
        const questioner = new Questioner({ interrogationBundle, output : progressLogger })
        await questioner.question()
        options.push(
          ...questioner.results.map(({ parameter, value }) => ({ name : `${plugin}.${parameter}`, value })))
      }
    }
  } // end plugin processing loop

  optionsLib.updatePluginSettings({ options, siteInfo })

  // now verify that all required settings are set
  for (const [plugin, { settings }] of Object.entries(siteInfo.plugins)) {
    const config = plugins[plugin].config
    const { name, options: configOptions } = config
    if (configOptions !== undefined) {
      for (const [option, { required }] of Object.entries(configOptions)) {
        if (required === true && settings[option] === undefined) {
          throw new Error(`Plugin '${name}' option '${option}' must be defined.`)
        }
      }
    }
  }

  let success
  ({ stackName, success } = await create({ db, globalOptions, noBuild, noDeleteOnFailure, siteInfo }))

  if (success === true) {
    const now = new Date()
    const remindAfter = new Date(now.getTime() + 4 * 60 * 60 * 1000) // give it 4 hours
    db.reminders.push({
      todo        : ACTION_SETUP_BILLING,
      command     : `cloudsite update --do-billing ${apexDomain}`,
      remindAfter : remindAfter.toISOString(),
      references  : apexDomain
    })
    return { success, userMessage : `Created site '${stackName}'/'www.${stackName}'.` }
  } else {
    return { success, userMessage : `Failed to create site '${stackName}'.` }
  }
}

export { handleCreate }
