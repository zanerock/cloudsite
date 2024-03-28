import commandLineArgs from 'command-line-args'

import { globalOptionsSpec } from '../constants'

let globalOptionsCache

const getGlobalOptions = ({ db }) => {
  if (globalOptionsCache !== undefined) {
    return globalOptionsCache
  } // else

  const globalOptions = db.account?.settings || {}

  const overrideOptions = commandLineArgs(globalOptionsSpec, { partial: true })
  delete overrideOptions._unknown // don't need or want this 

  Object.assign({}, globalOptions, overrideOptions)

  globalOptionsCache = globalOptions

  return globalOptions
}

export { getGlobalOptions }