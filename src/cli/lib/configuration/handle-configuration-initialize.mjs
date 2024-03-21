import { Questioner } from 'question-and-answer'

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

  const questioner = new Questioner({ interrogationBundle })
  await questioner.question()

  const results = questioner.results
    .reduce((acc, { parameter, value }) => { acc[parameter] = value; return acc }, {})

  db.account.settings = results
}

export { handleConfigurationInitialize }
