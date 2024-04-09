import { progressLogger } from '../../lib/shared/progress-logger'
import { todoTranslator } from './reminders/todo-translator'

const checkReminders = ({ reminders }) => {
  const now = new Date().getTime()
  const currentReminders = reminders.filter(({ remindAfter }) => {
    const remindAfterEpoch = Date.parse(remindAfter)
    return remindAfterEpoch <= now
  })

  if (currentReminders.length > 0) {
    const columnWidth = progressLogger.write.width
    const opener = '-- <yellow>Reminder<rst>' + (currentReminders.lengith > 1 ? 's ' : ' ')
    progressLogger.write(opener + '-'.repeat(columnWidth - opener.length + '<yellow>'.length + '<rst>'.length) + '\n')

    currentReminders.forEach((todoEntry, i) => {
      progressLogger.write((currentReminders.length > 1 ? i + '.' : '') + todoTranslator(todoEntry) + '\n')
    })

    progressLogger.write('-'.repeat(columnWidth) + '\n')
  }
}

export { checkReminders }
