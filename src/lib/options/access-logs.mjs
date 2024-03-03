const config = {
  options : { default : true, validation: (v) => 'boolean' === typeof v }
}

const handler = ({ cloudFormationTemplate, settings }) => {

}

const accessLogs = { config, handler }

export { accessLogs }
