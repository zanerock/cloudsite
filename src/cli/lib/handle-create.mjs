import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { awsS3TABucketNameRE, awsS3TABucketNameREString } from 'regex-repo'

import { cliSpec } from '../constants'
import { create } from '../../lib/actions/create'
import * as optionsLib from './options'
import { processSourceType } from './process-source-type'

const handleCreate = async ({ argv, globalOptions, sitesInfo }) => {
  const createOptionsSpec = cliSpec.commands.find(({ name }) => name === 'create').arguments
  const createOptions = commandLineArgs(createOptionsSpec, { argv })
  // action behavior options
  const noDeleteOnFailure = createOptions['no-delete-on-failure']
  // siteInfo options
  const apexDomain = createOptions['apex-domain']
  const bucketName = createOptions['bucket-name']
  const noBuild = createOptions['no-build']
  // switch any relative sourcePath to absolute
  const sourcePath = fsPath.resolve(createOptions['source-path'])
  let sourceType = createOptions['source-type']
  const stackName = createOptions['stack-name']
  const options = optionsLib.mapRawOptions(createOptions.option)
  console.log('options A:', options) // DEBUG

  const siteInfo = sitesInfo[apexDomain] || { apexDomain, bucketName, sourcePath, sourceType }
  siteInfo.region = createOptions.region || siteInfo.region || 'us-east-1'
  if (stackName !== undefined) {
    siteInfo.stackName = stackName
  }

  sitesInfo[apexDomain] = siteInfo

  // verify the parameters/options
  for (const option of ['apex-domain', 'source-path']) {
    if (createOptions[option] === undefined) {
      process.stderr.write(`Missing required '${option}' option.\n`)
      // TODO: handleHelp({ argv : ['create'] })
      process.exit(2) // eslint-disable-line no-process-exit
    }
  }
  // TODO: verify apex domain matches apex domain RE

  sourceType = processSourceType({ sourcePath, sourceType })

  if (bucketName !== undefined && !awsS3TABucketNameRE.test(bucketName)) {
    process.stderr(`Invalid bucket name. Must be valid AWS S3 Transfer Accelerated bucket name matching: ${awsS3TABucketNameREString}`)
    process.exit(2) // eslint-disable-line no-process-exit
  }

  optionsLib.updatePluginSettings({ options, siteInfo })

  // update siteInfo in case these were manually specified
  for (const [value, field] of [[bucketName, 'bucketName'], [sourcePath, 'sourcePath'], [sourceType, 'sourceType']]) {
    if (value !== undefined) {
      siteInfo[field] = value
    }
  }

  await create({ noBuild, noDeleteOnFailure, siteInfo, ...globalOptions })
}

export { handleCreate }
