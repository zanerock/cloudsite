import { v4 as uuidv4 } from 'uuid'

import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda'

import { progressLogger } from '../../shared/progress-logger'

const determineLambdaFunctionName = async ({ baseName, credentials, siteTemplate }) => {
  const { siteInfo } = siteTemplate
  const { region } = siteInfo
  let currentName = baseName

  const lambdaClient = new LambdaClient({ credentials, region })
  while (true) {
    progressLogger?.write(`Checking if Lambda function name '${currentName}' is free...`)
    const getFunctionCommand = new GetFunctionCommand({ FunctionName : currentName })
    try {
      await lambdaClient.send(getFunctionCommand)
    } catch (e) {
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
        progressLogger?.write('FREE\n')
        return currentName
      } else {
        progressLogger?.write('\n')
        throw e
      }
    }
    progressLogger?.write('NOT free\n')
    const nameSalt = uuidv4().slice(0, 8)
    currentName = currentName.replace(/-[A-F0-9]{8}$/i, '')
    currentName += '-' + nameSalt
  }
}

export { determineLambdaFunctionName }
