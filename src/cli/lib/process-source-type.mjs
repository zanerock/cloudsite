import { existsSync as fileExists } from 'node:fs'
import { resolve as resolvePath } from 'node:path'

import { SOURCE_TYPES } from '../constants'

const processSourceType = ({ sourcePath, sourceType }) => {
  if (sourceType === undefined) {
    const docusaurusConfigPath = resolvePath(sourcePath, '..', 'docusaurus.config.js')
    sourceType = fileExists(docusaurusConfigPath) ? 'docusaurus' : 'vanilla'
  } else if (!SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`Invalid site source type '${sourceType}'; must be one of ${SOURCE_TYPES.join(', ')}.\n`, 2)
  }

  return sourceType
}

export { processSourceType }
