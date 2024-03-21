import * as fs from 'node:fs/promises'

import { commandLineArgs } from 'command-line-args'

import { formatOutput } from '../format-output'

import { cliSpec } from '../../constants'

const handleConfigurationShow = async ({ argv, db }) => {
  const showConfigurationCLISpec = cliSpec
    .commands.find(({ name }) => name === 'configuration')
    .commands.find(({ name }) => name === 'show')
  const showConfigurationOptionsSpec = showConfigurationCLISpec.arguments
  const showConfigurationOptions = commandLineArgs(showConfigurationOptionsSpec, { argv })
  const { format } = configurationOptions

  const accountSettings = db.account.settings || {}
  process.stdout.write(formatOutput({ format, output: accountSettings }))
}

export { handleConfigurationShow }
