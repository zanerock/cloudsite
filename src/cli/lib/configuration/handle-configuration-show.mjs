import * as fs from 'node:fs/promises'

import { GLOBAL_OPTIONS } from '../../constants' // eslint-disable-line node/no-missing-import

const handleConfigurationShow = async () => {
  const globalOptionsPath = GLOBAL_OPTIONS
  const globalOptionsContents = await fs.readFile(globalOptionsPath, { encoding : 'utf8' })
  process.stdout.write(globalOptionsContents)
}

export { handleConfigurationShow }
