import { existsSync as fileExists } from 'node:fs'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { awsS3TABucketNameRE, awsS3TABucketNameREString } from 'regex-repo'

import { cliSpec, SOURCE_TYPES } from '../constants'
import { create } from '../../lib/create'

const handleCreate = async ({ argv, globalOptions, sitesInfo }) => {
  const createOptionsSpec = cliSpec.commands.find(({ name }) => name === 'create').arguments
  const createOptions = commandLineArgs(createOptionsSpec, { argv })
  // action behavior options
  const noDeleteOnFailure = createOptions['no-delete-on-failure']
  // siteInfo options
  const apexDomain = createOptions['apex-domain']
  const bucketName = createOptions['bucket-name']
  const sourcePath = createOptions['source-path']
  let sourceType = createOptions['source-type']

  const siteInfo = sitesInfo[apexDomain] || { apexDomain, bucketName, sourcePath, sourceType }
  siteInfo.region = createOptions.region || siteInfo.region || 'us-east-1'

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

  if (sourceType === undefined) {
    const docusaurusConfigPath = fsPath.resolve(sourcePath, '..', 'docusaurus.config.js')
    sourceType = fileExists(docusaurusConfigPath) ? 'docusaurus' : 'vanilla'
  } else if (!SOURCE_TYPES.includes(sourceType)) {
    process.stderr(`Invalid site source type '${sourceType}'; must be one of ${SOURCE_TYPES.join(', ')}.\n`)
    process.exit(2) // eslint-disable-line no-process-exit
  }

  if (bucketName !== undefined && !awsS3TABucketNameRE.test(bucketName)) {
    process.stderr(`Invalid bucket name. Must be valid AWS S3 Transfer Accelerated bucket name matching: ${awsS3TABucketNameREString}`)
    process.exit(2) // eslint-disable-line no-process-exit
  }

  await create({ noDeleteOnFailure, siteInfo, ...globalOptions })
}

export { handleCreate }
