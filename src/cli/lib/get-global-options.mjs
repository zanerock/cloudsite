import commandLineArgs from 'command-line-args'

import { globalOptionsSpec } from '../constants'

const getGlobalOptions = ({ db }) => {
  const globalOptions = db.account?.settings || {}

  const overrideOptions = commandLineArgs(globalOptionsSpec, { partial: true })
  delete overrideOptions._unknown // don't need or want this 

  Object.assign({}, globalOptions, overrideOptions)

  return globalOptions
}

export { getGlobalOptions }