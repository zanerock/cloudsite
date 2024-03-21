import { errorOut } from './error-out'

const getValueContainerAndKey = ({ path, rootContainer, spec, value }) => {
  // walks the path, creating new containers along the way as necessary
  return path.reduce(([currContainer, spec], bit, i) => {
    // then we're at the terminal path bit; let's analyze whether it's valid and if value passes validation
    if (i === path.length - 1) {
      spec = spec?.[bit]
      if (spec !== undefined) {
        const { matches, validation } = spec
        if (validation === undefined && matches === undefined) {
          throw new Error(`'${path}' does not appear to be a terminal path.`)
        }
        if (matches !== undefined && value.match(matches) === null) {
          throw new Error(`Invalid value '${value}' for '${path}'; must match ${matches.toString()}.`)
        }

        if (validation !== undefined && !validation(value)) {
          throw new Error(`Value '${value}' for '${path}' failed validation.`)
        }
      }

      return { valueKey : path[i], valueContainer : currContainer }
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
