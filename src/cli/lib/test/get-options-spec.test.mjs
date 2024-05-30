import { getOptionsSpec } from '../get-options-spec'
import { globalOptionsSpec } from '../../constants'

const testSpec = {
  mainCommand : 'foo', // TODO: should just be command
  description : 'Stuff.',
  commands    : [
    {
      name        : 'bar',
      description : 'Things.',
      arguments   : [
        {
          name        : 'blah',
          description : 'Bing.'
        }
      ],
      commands : [
        {
          name        : 'baz',
          description : 'What not.',
          arguments   : [
            {
              name        : 'biz',
              description : 'Boop.'
            }
          ]
        }
      ]
    }
  ]
}

describe('getOptionsSpec', () => {
  test('when options provided, returns options merged with global options', () => {
    const optionsSpec = getOptionsSpec({ optionsSpec : [{ name : 'foo', description : 'bar' }] })
    expect(optionsSpec).toHaveLength(globalOptionsSpec.length + 1)
  })

  test('when name provided, returns first level arguments', () => {
    const optionsSpec = getOptionsSpec({ cliSpec : testSpec, name : 'bar' })
    expect(optionsSpec[0].name).toBe('blah')
  })

  test('when path provided, returns the options for the final command in the path', () => {
    const optionsSpec = getOptionsSpec({ cliSpec : testSpec, path : ['bar', 'baz'] })
    expect(optionsSpec[0].name).toBe('biz')
  })
})
