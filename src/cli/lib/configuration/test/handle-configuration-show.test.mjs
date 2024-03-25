import { StringOut } from 'magic-print'

import { configureLogger } from '../../../../lib/shared/progress-logger'
import { handleConfigurationShow } from '../handle-configuration-show'

const settingsVal = 'hi'

jest.mock('node:fs/promises', () => ({
  readFile : () => settingsVal
}))

describe('handleConfigurationShow', () => {
  let stringOut
  beforeEach(() => {
    stringOut = new StringOut()
    configureLogger({ out : stringOut })
  })

  test('prints the file contents', async () => {
    await handleConfigurationShow({ argv : [], db : { account : { settings : settingsVal } } })
    expect(stringOut.string).toBe(settingsVal + '\n')
  })
})
