import { errorOut } from './error-out'
import { VALID_FORMATS } from '../constants'

const checkFormat = (format) => {
  if (!VALID_FORMATS.includes(format)) {
    errorOut(`Invalid output format '${format}'. Must be one of: ${VALID_FORMATS.join(', ')}`)
  }
}

export { checkFormat }
