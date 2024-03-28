import { Questioner } from 'question-and-answer'

import { progressLogger } from '../../../lib/shared/progress-logger'

const handleConfigurationInitialize = async ({ db }) => {
  const interrogationBundle = {
    actions : [
      {
        prompt    : 'Which local AWS SSO profile should be used for authentication?',
        parameter : 'sso-profile'
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({ interrogationBundle, output : progressLogger })
  await questioner.question()

  db.account.settings = questioner.values
}

export { handleConfigurationInitialize }
