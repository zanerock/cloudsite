const name = 'access-logs'

const config = {
  options : { default : true, validation : (v) => typeof v === 'boolean' }
}

const handler = () => {
  throw new Error('Not yet implemented')
}

const importHandler = () => {}

const accessLogs = { config, handler, importHandler, name }

export { accessLogs }
