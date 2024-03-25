import { getPrinter } from 'magic-print'

let progressLogger = {}

const configureLogger = (options) => {
  progressLogger.write = getPrinter(options)
}

export { configureLogger, progressLogger }
