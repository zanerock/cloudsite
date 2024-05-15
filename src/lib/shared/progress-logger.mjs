import { getPrinter } from 'magic-print'

const progressLogger = {}

const configureLogger = (options) => {
  if (typeof options === 'function') {
    progressLogger.write = options
    return
  }
  // else
  const print = getPrinter(options)

  progressLogger.write = (...chunks) => {
    // do options here so it'll react to changes
    if (options.quiet !== true) {
      print(...chunks)
    }
  }

  progressLogger.writeWithOptions = (options, ...chunks) => {
    if (options.quiet !== true) {
      print.withOptions(options)(...chunks)
    }
  }

  progressLogger.write.width = print.width
}

export { configureLogger, progressLogger }
