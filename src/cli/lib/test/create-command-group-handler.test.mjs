import { createCommandGroupHandler } from '../create-command-group-handler'

describe('createCommandGroupHandler', () => {
  test('returns valid 1st level handler', async () => {
    const groupHandlerFunction = createCommandGroupHandler({
      commandHandlerMap : { 'configure-tags' : () => true },
      groupPath         : ['billing']
    })

    const result = await groupHandlerFunction({ argv : ['configure-tags'] })
    expect(result).toBe(true)
  })

  test.only('returns valid 2nd level handler', async () => {
    const groupHandlerFunction = createCommandGroupHandler({
      commandHandlerMap : {
        sso : createCommandGroupHandler({
          commandHandlerMap : { 'create' : () => true },
          groupPath : ['permissions', 'sso']
        })
      },
      groupPath : ['permissions']
    })

    const result = await groupHandlerFunction({ argv: ['sso', 'create'] })
    expect(result).toBe(true)
  })

  test('complains if command handler map entry count too low', () => {
    expect(() => createCommandGroupHandler({
      commandHandlerMap : {},
      groupPath         : ['billing']
    })).toThrow(/expected 1/)
  })

  test('complains if command handler map entry count too high', () => {
    expect(() => createCommandGroupHandler({
      commandHandlerMap : { 'configure-tags' : () => true, bar : () => true },
      groupPath         : ['billing']
    })).toThrow(/expected 1/)
  })

  test('complains if command handler map has mis-matched entry', () => {
    expect(() => createCommandGroupHandler({
      commandHandlerMap : { foo : () => true },
      groupPath         : ['billing']
    })).toThrow(/Did not find.+?'configure-tags'.+?typo/)
  })

  test('generated command group handler throws on unknown commands', async () => {
    const groupHandlerFunction = createCommandGroupHandler({
      commandHandlerMap : { 'configure-tags' : () => true },
      groupPath         : ['billing']
    })

    try {
      await groupHandlerFunction({ argv : ['bad-command'] })
    } catch (e) {
      expect(e.message).toMatch(/Unknown/)
    }
  })
})
