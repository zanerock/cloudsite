import { todoTranslator } from './todo-translator'

const handleRemindersList = ({ db }) => {
  const todoList = db.reminders.map(({ command, ...todoEntry }) => ({ todo : todoTranslator(todoEntry), command }))

  return { data : todoList, success : true }
}

export { handleRemindersList }
