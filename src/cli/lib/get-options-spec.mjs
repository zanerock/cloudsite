import { globalOptionsSpec } from '../constants'

const getOptionsSpec = ({ cliSpec, optionsSpec, name, path }) => {
  optionsSpec = optionsSpec ||
    (name !== undefined && cliSpec?.commands.find(({ name : testName }) => name === testName).arguments) ||
    (path !== undefined && path.reduce((spec, command, i, arr) => {
      const commandSpec = spec.commands.find(({ name : testName }) => command === testName)
      if (i === arr.length - 1) {
        return commandSpec.arguments
      } else {
        return commandSpec
      }
    }, cliSpec)) ||
    []
  const finalSpec =
    [
      ...optionsSpec,
      // this is so we can process the global options anywhere while also sounding alarm on unknown options
      ...globalOptionsSpec
    ]

  return finalSpec
}

export { getOptionsSpec }
