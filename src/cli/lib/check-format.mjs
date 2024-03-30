import { VALID_FORMATS } from '../constants'

const checkFormat = (format) => {
  if (format !== undefined && !VALID_FORMATS.includes(format)) {
    throw new Error(`Invalid output format '${format}'. Must be one of: ${VALID_FORMATS.join(', ')}`)
  }
}

export { checkFormat }
