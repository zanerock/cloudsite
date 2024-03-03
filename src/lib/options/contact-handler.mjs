const config = {
  options: {
    urlPath : { default : '/contact' }
  }
}

const handler = ({ cloudFormationTemplate, settings }) => {

}

const contactHandler = { config, handler }

export { contactHandler }
