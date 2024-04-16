import { Questioner } from 'question-and-answer'

import { handleConfigurationSetupLocal } from '../handle-configuration-setup-local'

jest.mock('node:fs/promises')

describe('handleConfigurationSetupLocal', () => {
  const questionValues = { 'sso-profile' : 'some-profile' }
  let db

  afterEach(jest.clearAllMocks)

  beforeAll(async () => {
    jest.spyOn(Questioner.prototype, 'question').mockResolvedValue(undefined)
    jest.spyOn(Questioner.prototype, 'values', 'get').mockReturnValue(questionValues)
    db = { account : { localSettings : {} } }
    await handleConfigurationSetupLocal({ db })
  })

  test('questions the user', async () => expect(Questioner.prototype.question).toHaveBeenCalledTimes(1))

  test('updates the account settings', async () =>
    expect(db.account.localSettings).toEqual({ 'sso-profile' : questionValues['sso-profile'] }))
})
