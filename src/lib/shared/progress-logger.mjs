import { getPrinter } from 'magic-print'

const progressLogger = {}

const configureLogger = (options) => {
  progressLogger.write = getPrinter(options)
}

export { configureLogger, progressLogger }
