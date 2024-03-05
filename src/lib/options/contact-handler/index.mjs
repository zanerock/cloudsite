const config = {
  options : {
    urlPath : {
      default : '/contact-handler',
      matches : /^\/(?:[a-z0-9_-]+\/?)+$/
    }
  }
}

const handler = ({ cloudFormationTemplate, settings }) => {
  throw new Error('Not yet implemented')
}

const contactHandler = { config, handler }

export { contactHandler }
