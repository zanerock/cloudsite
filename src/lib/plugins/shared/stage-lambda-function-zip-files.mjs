// TODO: this is replicated in contant-handler and index-rewriter; once we implement build with rollub, move to a
// shared library. Or create a 'cloudsite-plugin-tools' package?
import { join as pathJoin } from 'node:path'
import { createReadStream } from 'node:fs'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { ensureLambdaFunctionBucket } from '../shared/ensure-lambda-function-bucket'
import { progressLogger } from '../../shared/progress-logger'
// jsdoc wants this, but it causes a circular dependency
// import { SiteTemplate } from '../../../shared/site-template'

/* eslint-disable  jsdoc/no-undefined-types */ // See note above re. SiteTemplate
/**
 * Stages the zipped Lambda function packages on a common S3 bucket.
 * @param {object} input - Destructured input argument.
 * @param {object} input.credentials - Credentials to access the AWS account.
 * @param {string[]} input.lambdaFunctionNames - Array of file names in dist to transfer to the lambda function bucket.
 * @param {object} input.siteInfo - See {@link SiteTemplate} for details.
 * @returns {string} The Lambda function bucket name.
 */ /* eslint-enable  jsdoc/no-undefined-types */
const stageLambdaFunctionZipFiles = async ({ credentials, lambdaFileNames, siteInfo }) => {
  progressLogger.write('Staging contact handler Lambda function zip files...\n')

  const { region } = siteInfo

  const s3Client = new S3Client({ credentials, region })

  const lambdaFunctionsBucket = await ensureLambdaFunctionBucket({ credentials, s3Client, siteInfo })

  const putCommands = []
  for (const fileName of lambdaFileNames) {
    putZipFile({ bucketName : lambdaFunctionsBucket, fileName, s3Client })
  }

  await Promise.all(putCommands)

  return lambdaFunctionsBucket
}

const putZipFile = async ({ bucketName, fileName, s3Client }) => {
  // when built, everything sits in './dist' together
  const zipPath = pathJoin(__dirname, fileName)
  const readStream = createReadStream(zipPath)

  const putObjectCommand = new PutObjectCommand({
    Body        : readStream,
    Bucket      : bucketName,
    Key         : fileName,
    ContentType : 'application/zip'
  })

  await s3Client.send(putObjectCommand)
}

export { stageLambdaFunctionZipFiles }
