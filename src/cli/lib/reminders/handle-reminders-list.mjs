const handleRemindersList = ({ db }) => {
  return { data : db.reminders, success : true }
}

export { handleRemindersList }
