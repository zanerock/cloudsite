const config = {
  options : {
    urlPath : {
      default : '/contact-handler',
      matches : /^\/(?:[a-z0-9_-]+\/?)+$/
    }
  }
}

const handler = ({ cloudFormationTemplate, options, siteInfo }) => {
  cloudFormationTemplate.Resources.LambdaS3Bucket = {
    Type       : 'AWS::S3::Bucket',
    Properties : {
      AccessControl : 'Private',
      BucketName    : this.bucketName
    }
  }
}

const contactHandler = { config, handler }

export { contactHandler }
