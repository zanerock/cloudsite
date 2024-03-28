import { globalOptions } from '../constants'

const getOptionsSpec = ({ cliSpec, optionsSpec, name }) => {
  optionsSpec = optionsSpec || cliSpec?.commands.find(({ name : testName }) => name === testName).arguments || []
  const finalSpec =
    [
      ...optionsSpec,
      // this is so we can process the global options anywhere while also sounding alarm on unknown options
      ...globalOptions
    ]

  return finalSpec
}

export { getOptionsSpec }