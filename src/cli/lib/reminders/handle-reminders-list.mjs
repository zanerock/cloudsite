import { todoTranslator } from './todo-translator'

const handleRemindersList = ({ db }) => {
  let todoList = db.reminders.map(({ command, ...todoEntry }) => ({ todo : todoTranslator(todoEntry), command }))

  if (todoList.length === 0) {
    todoList = ''
  }

  return { data : todoList, success : true }
}

export { handleRemindersList }
