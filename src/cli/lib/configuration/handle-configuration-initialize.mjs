import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { Questioner } from 'question-and-answer'

const handleConfigurationInitialize = async () => {
  const interrogationBundle = {
    actions : [
      {
        prompt    : 'Set the SSO profile:',
        parameter : 'ssoProfile'
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({ interrogationBundle })
  await questioner.question()

  const results = questioner.results
    .reduce((acc, { parameter, value }) => { acc[parameter] = value; return acc }, {})

  const configPath = fsPath.join(process.env.HOME, '.config', 'cloudsite', 'global-options.json')
  const configContents = JSON.stringify(results, null, '  ')

  await fs.mkdir(fsPath.dirname(configPath), { recursive : true })
  await fs.writeFile(configPath, configContents, { encoding : 'utf8' })
}

export { handleConfigurationInitialize }
