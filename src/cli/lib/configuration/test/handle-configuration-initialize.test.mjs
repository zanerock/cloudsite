import { writeFile as mockWriteFile } from 'node:fs/promises'

import { Questioner } from 'question-and-answer'

import { GLOBAL_OPTIONS_PATH } from '../../../constants'
import { handleConfigurationInitialize } from '../handle-configuration-initialize'

jest.mock('node:fs/promises')

describe('handleConfigurationInitialize', () => {
  const questionResults = [{ parameter : 'ssoProfile', value : 'some-profile' }]

  test('questions the user', async () => {
    jest.spyOn(Questioner.prototype, 'question').mockResolvedValue(undefined)
    jest.spyOn(Questioner.prototype, 'results', 'get')
      .mockReturnValue(questionResults)

    await handleConfigurationInitialize()
    expect(Questioner.prototype.question).toHaveBeenCalledTimes(1)
  })

  test('attempts to write configuration result with anwsers', async () => {
    const mockResults = { ssoProfile : 'some-profile' }
    jest.spyOn(Questioner.prototype, 'question').mockResolvedValue(undefined)
    jest.spyOn(Questioner.prototype, 'results', 'get')
      .mockReturnValue(mockResults)

    const expectedContents = JSON.stringify(mockResults, null, '  ')
    expect(mockWriteFile).toHaveBeenCalledWith(GLOBAL_OPTIONS_PATH, expectedContents, { encoding : 'utf8' })
  })
})
