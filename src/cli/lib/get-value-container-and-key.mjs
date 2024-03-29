import { errorOut } from './error-out'

const getValueContainerAndKey = ({ path, pathPrefix, rootContainer, skipValueCheck, spec, value }) => {
  const origPath = (pathPrefix === undefined ? '' : pathPrefix) + path.join('.') // used if validation error
  if (path === undefined || path.length === 0) {
    return [rootContainer, undefined]
  }
  // walks the path, creating new containers along the way as necessary
  return path.reduce(([currContainer, currSpec], bit, i) => {
    // then we're at the terminal path bit; let's analyze whether it's valid and if value passes validation
    if (i === path.length - 1) {
      currSpec = currSpec?.[bit]
      if (currSpec !== undefined) {
        const { matches, validation } = currSpec
        if (validation === undefined && matches === undefined) {
          throw new Error(
            `Plugin option '${origPath}' spec must define either 'validation' or 'matches'.`,
            { exitCode : 11 }
          )
        }
        if (matches !== undefined && value?.match(matches) === null) {
          throw new Error(
            `Invalid value '${value}' for '${origPath}'; must match ${matches.toString()}.`,
            { exitCode : 3 }
          )
        }

        if (skipValueCheck !== true && validation !== undefined && !validation(value)) {
          throw new Error(`Value '${value}' for '${origPath}' failed validation.`, { exitCode : 3 })
        }
      } else { // currSpec === undefined
        throw new Error(`Path '${origPath}' incorrect; no such terminal bit '${bit}'.`, { exitCode : 3 })
      }

      return { valueKey : path[i], valueContainer : currContainer }
    } else {
      const currSpec = spec?.[bit]
      if (currSpec === undefined && i > 0) {
        errorOut(`Invalid option path '${origPath}'; no such element '${bit}'.\n`)
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
