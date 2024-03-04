import { errorOut } from './error-out'

const getValueContainerAndKey = ({ path, rootContainer, spec, value }) => {
  const pathBits = path.split('.')

  return pathBits.reduce(([currContainer, spec], bit, i) => {
    if (i === pathBits.length - 1) {
      spec = spec?.[bit]
      if (spec !== undefined) {
        const { matches, validation } = spec
        if (validation === undefined && matches === undefined) {
          errorOut(`'${path}' does not appear to be a terminal path.\n`)
        }
        if (matches !== undefined && value.match(matches) === null) {
          errorOut(`Invalid value '${value}' for '${path}'; must match ${matches.toString()}.\n`)
        }
        
        if (!validation?.(value)) {
          errorOut(`Value '${value}' for '${path}' failed validation.\n`)
        }
      }

      return { valueKey : pathBits[i], valueContainer : currContainer }
    } else {
      const currSpec = spec[bit]
      if (currSpec === undefined && i > 0) {
        errorOut(`Invalid option path '${path}'; no such element '${bit}'.\n`)
      }
      const container = currContainer[bit]
      if (container === undefined) {
        currContainer[bit] = {}
      }
      return [currContainer[bit], currSpec]
    }
  }, [rootContainer, spec])
}

export { getValueContainerAndKey }