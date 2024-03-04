const config = {
  options : { default : true, validation : (v) => typeof v === 'boolean' }
}

const handler = ({ cloudFormationTemplate, settings }) => {

}

const accessLogs = { config, handler }

export { accessLogs }
