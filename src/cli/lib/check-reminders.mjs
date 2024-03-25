import { progressLogger } from '../../lib/shared/progress-logger'

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

    currentReminders.forEach(({ todo }, i) => {
      progressLogger.write((currentReminders.length > 1 ? i + '.' : '') + todo + '\n')
    })

    progressLogger.write('-'.repeat(columnWidth) + '\n')
  }
}

export { checkReminders }
