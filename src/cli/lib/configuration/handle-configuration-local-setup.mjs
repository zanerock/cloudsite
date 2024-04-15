import { Questioner } from 'question-and-answer'

import { progressLogger } from '../../../lib/shared/progress-logger'

const handleConfigurationLocalSetup = async ({ db }) => {
  const interrogationBundle = {
    actions : [
      {
        prompt    : "Which local AWS SSO profile should be used for authentication? Hit '<enter>' to use the default profile.",
        parameter : 'sso-profile'
      },
      {
        prompt    : 'Which default format would you prefer?',
        options   : ['json', 'text', 'terminal', 'yaml'],
        default   : 'terminal',
        parameter : 'format'
      },
      {
        prompt    : "In 'quiet' mode, you only get output when an command has completed. In 'non-quiet' mode, you will receive updates as the command is processed. Would you like to activate quiet mode?",
        type      : 'boolean',
        default   : false,
        parameter : 'quiet'
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({ interrogationBundle, output : progressLogger })
  await questioner.question()

  db.account.settings = questioner.values

  return { success : true, userMessage : 'Settings updated.' }
}

export { handleConfigurationLocalSetup }
