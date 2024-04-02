import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getOptionsSpec } from './get-options-spec'
import { handleRemindersList } from './reminders/handle-reminders-list'

const handleReminders = async ({ argv, db }) => {
  const remindersOptionsSpec = getOptionsSpec({ cliSpec, name : 'reminders' })
  const remindersOptions = commandLineArgs(remindersOptionsSpec, { argv, stopAtFirstUnknown : true })
  const { subcommand } = remindersOptions
  argv = remindersOptions._unknown || []

  switch (subcommand) {
    case 'list':
      return await handleRemindersList({ argv, db })
    default:
      throw new Error('Unknown reminders command: ' + subcommand)
  }
}

export { handleReminders }
