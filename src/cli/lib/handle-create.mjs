import { existsSync as fileExists } from 'node:fs'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { awsS3TABucketNameRE, awsS3TABucketNameREString } from 'regex-repo'

import { cliSpec, SOURCE_TYPES } from '../constants'
import { create } from '../../lib/actions/create'

const handleCreate = async ({ argv, globalOptions, sitesInfo }) => {
  // build up the options
  const options = structuredClone(globalOptions)

  const createOptionsSpec = cliSpec.commands.find(({ name }) => name === 'create').arguments
  const createOptions = commandLineArgs(createOptionsSpec, { argv })
  options.apexDomain = createOptions['apex-domain']
  options.bucketName = createOptions['bucket-name']
  options.region = createOptions.region || 'us-east-1'
  options.sourcePath = createOptions['source-path']
  options.sourceType = createOptions['source-type']

  const siteInfo = sitesInfo[options.apexDomain] || { apexDomain: options.apexDomain }
  sitesInfo[options.apexDomain] = siteInfo
  options.siteInfo = siteInfo

  // verify the parameters/options
  for (const option of ['apex-domain', 'source-path']) {
    if (createOptions[option] === undefined) {
      process.stderr.write(`Missing required '${option}' option.\n`)
      // TODO: handleHelp({ argv : ['create'] })
      process.exit(2) // eslint-disable-line no-process-exit
    }
  }
  // TODO: verify apex domain matches apex domain RE

  if (options.sourceType === undefined) {
    const docusaurusConfigPath = fsPath.join(options.sourcePath, 'docusaurus.config.js')
    options.sourceType = fileExists(docusaurusConfigPath) ? 'docusaurus' : 'vanilla'
  } else if (!SOURCE_TYPES.includes(options.sourceType)) {
    process.stderr(`Invalid site source type '${options.sourceType}'; must be one of ${SOURCE_TYPES.join(', ')}.\n`)
    process.exit(2) // eslint-disable-line no-process-exit
  }

  if (options.bucketName !== undefined && !awsS3TABucketNameRE.test(options.bucketName)) {
    process.stderr(`Invalid bucket name. Must be valid AWS S3 Transfer Accelerated bucket name matching: ${awsS3TABucketNameREString}`)
    process.exit(2) // eslint-disable-line no-process-exit
  }

  await create(options)
}

export { handleCreate }
