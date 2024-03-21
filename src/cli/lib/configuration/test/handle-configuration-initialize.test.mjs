import { Questioner } from 'question-and-answer'

import { handleConfigurationInitialize } from '../handle-configuration-initialize'

jest.mock('node:fs/promises')

describe('handleConfigurationInitialize', () => {
  const questionResults = [{ parameter : 'ssoProfile', value : 'some-profile' }]

  afterEach(jest.clearAllMocks)

  test('questions the user', async () => {
    jest.spyOn(Questioner.prototype, 'question').mockResolvedValue(undefined)
    jest.spyOn(Questioner.prototype, 'results', 'get')
      .mockReturnValue(questionResults)

    const db = { account : { settings : {} } }
    await handleConfigurationInitialize({ db })
    expect(Questioner.prototype.question).toHaveBeenCalledTimes(1)
  })

  test('updates the account settings', async () => {
    jest.spyOn(Questioner.prototype, 'question').mockResolvedValue(undefined)
    jest.spyOn(Questioner.prototype, 'results', 'get').mockReturnValue(questionResults)

    const db = { account : { settings : {} } }
    await handleConfigurationInitialize({ db })
    expect(db.account.settings).toEqual({ ssoProfile : questionResults[0].value })
  })
})
