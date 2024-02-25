import { handleConfigurationShow } from '../handle-configuration-show' // eslint-disable-line node/no-missing-import

const expectedOutput = 'hi'

jest.mock('node:fs/promises', () => ({
  readFile : () => expectedOutput
}))

describe('handleConfigurationShow', () => {
  let output
  let origWrite
  beforeAll(() => {
    origWrite = process.stdout.write
    process.stdout.write = (chunk) => { output = chunk }
  })

  afterAll(() => {
    process.stdout.write = origWrite
  })

  test('prints the file contents', async () => {
    await handleConfigurationShow()
    expect(output).toBe(expectedOutput)
  })
})
