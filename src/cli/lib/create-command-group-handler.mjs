import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'

const createCommandGroupHandler = ({ commandHandlerMap, groupPath }) => {
  // validate the commandHandlerMap
  const commands = groupPath.reduce((spec, command, i, arr) => {
    const commandSpec = spec.commands.find(({ name : testName }) => command === testName)
    if (i === arr.length - 1) {
      return commandSpec.commands
    } else {
      return commandSpec
    }
  }, cliSpec)

  const commandHandlerMapCount = Object.keys(commandHandlerMap).length
  if (commands.length !== commandHandlerMapCount) {
    throw new Error(`Command handler map for group '${groupPath.join(' ')}' has ${commandHandlerMapCount} entries, expected ${commands.length}`)
  } else {
    for (const { name } of commands) {
      if (commandHandlerMap[name] === undefined) {
        throw new Error(`Did not find mapping for command '${name}' in command handler for group '${groupPath.join(' ')}'. Entry count is correct, do you have a typo in the command names?`)
      }
    }
  }

  return async ({ argv, db, globalOptions }) => {
    const optionsSpec = getOptionsSpec({ cliSpec, path : groupPath })
    const options = commandLineArgs(optionsSpec, { argv, stopAtFirstUnknown : true })
    const { subcommand } = options
    argv = options._unknown || []

    const handler = commandHandlerMap[subcommand]

    if (handler !== undefined) {
      return await handler({ argv, db, globalOptions })
    } else {
      throw new Error(`Unknown '${groupPath.join(' ')}' command: ${subcommand}`)
    }
  }
}

export { createCommandGroupHandler }
