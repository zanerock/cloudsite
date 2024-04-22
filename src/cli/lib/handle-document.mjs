import commandLineArgs from 'command-line-args'
import { commandLineDocumentation } from 'command-line-documentation'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'

const handleDocument = ({ argv, db }) => {
  const documentOptionsSpec = getOptionsSpec({ cliSpec, name : 'document' })
  const documentOptions = commandLineArgs(documentOptionsSpec, { argv })
  // action behavior options
  const { prefix = '', 'section-depth': sectionDepth = 1, title = 'Command reference' } = documentOptions

  const data = commandLineDocumentation(cliSpec, { sectionDepth, title })

  return { data, success: true }
}

export { handleDocument }