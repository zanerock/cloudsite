const config = {
  options : {
    urlPath : {
      default : '/contact',
      matches : /^\/(?:[a-z0-9_-]+\/?)+$/
    }
  }
}

const handler = ({ cloudFormationTemplate, settings }) => {

}

const contactHandler = { config, handler }

export { contactHandler }
