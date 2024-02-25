import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { Questioner } from 'question-and-answer'

import { GLOBAL_OPTIONS } from '../../constants' // eslint-disable-line node/no-missing-import

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

  const globalOptionsPath = GLOBAL_OPTIONS
  const globalOptionsContents = JSON.stringify(results, null, '  ')

  await fs.mkdir(fsPath.dirname(globalOptionsPath), { recursive : true })
  await fs.writeFile(globalOptionsPath, globalOptionsContents, { encoding : 'utf8' })
}

export { handleConfigurationInitialize }
