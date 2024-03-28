import { Questioner } from 'question-and-answer'

import { handleConfigurationInitialize } from '../handle-configuration-initialize'

jest.mock('node:fs/promises')

describe('handleConfigurationInitialize', () => {
  const questionValues = { ssoProfile : 'some-profile' }
  let db

  afterEach(jest.clearAllMocks)

  beforeAll(async () => {
    jest.spyOn(Questioner.prototype, 'question').mockResolvedValue(undefined)
    jest.spyOn(Questioner.prototype, 'values', 'get').mockReturnValue(questionValues)
    db = { account : { settings : {} } }
    await handleConfigurationInitialize({ db })
  })

  test('questions the user', async () => expect(Questioner.prototype.question).toHaveBeenCalledTimes(1))

  test('updates the account settings', async () =>
    expect(db.account.settings).toEqual({ ssoProfile : questionValues.ssoProfile }))
})
