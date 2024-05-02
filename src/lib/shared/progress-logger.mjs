import { getPrinter } from 'magic-print'

const progressLogger = {}

const configureLogger = (options) => {
  if (typeof options === 'function') {
    progressLogger.write = options
  }
  // else
  const print = getPrinter(options)

  progressLogger.write = (...chunks) => {
    // do options here so it'll react to changes
    const { quiet } = options

    if (quiet !== true) {
      print(...chunks)
    }
  }

  progressLogger.write.width = print.width
}

export { configureLogger, progressLogger }
