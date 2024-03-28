import commandLineArgs from 'command-line-args'

import { globalOptionsSpec } from '../constants'

let globalOptionsCache

const getGlobalOptions = ({ db }) => {
  if (globalOptionsCache !== undefined) {
    return globalOptionsCache
  } // else

  const defaultOptions = db?.account?.settings || {}

  const overrideOptions = commandLineArgs(globalOptionsSpec, { partial: true })
  delete overrideOptions._unknown // don't need or want this 

  const globalOptions = Object.assign({}, defaultOptions, overrideOptions)

  const { format, verbose } = globalOptions
  let { quiet } = globalOptions
  // process.stdin.isTTY =~ shell program (true) or pipe (false)
  quiet = quiet || (verbose !== true && (format === 'json' || format === 'yaml' || process.stdin.isTTY))
  globalOptions.quiet = quiet

  globalOptionsCache = globalOptions

  return globalOptions
}

export { getGlobalOptions }