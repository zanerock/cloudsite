const checkReminders = ({ reminders }) => {
  const now = new Date().getTime()
  const currentReminders = reminders.filter(({ remindAfter }) => {
    const remindAfterEpoch = Date.parse(remindAfter)
    return remindAfterEpoch <= now
  })


  if (currentReminders.length > 0) {
    const columnWidth = process.stdout.columns || 40
    const opener = '-- Reminder' + (currentReminders.lengith > 1 ? 's ' : ' ')
    process.stdout.write(opener + '-'.repeat(columnWidth - opener.length))
    
    currentReminders.forEach(({ todo }, i) => {
      if (currentReminders.length > 1) {
        process.stdout.write(i + '.')
      }
      process.stdout.write(todo + '\n')
    })

    process.stdout.write('-'.repeat(columnWidth) + '\n')
  }
}

export { checkReminders }
