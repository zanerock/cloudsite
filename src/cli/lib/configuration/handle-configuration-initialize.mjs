import { Questioner } from 'question-and-answer'

import { progressLogger } from '../../../lib/shared/progress-logger'

const handleConfigurationInitialize = async ({ db }) => {
  const interrogationBundle = {
    actions : [
      {
        prompt    : 'Set the SSO profile:',
        parameter : 'ssoProfile'
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({ interrogationBundle, output : progressLogger })
  await questioner.question()

  db.account.settings = questioner.values
}

export { handleConfigurationInitialize }
