import { convertDomainToBucketName } from '../../shared/convert-domain-to-bucket-name'
import { determineBucketName } from '../../shared/determine-bucket-name'

const config = {
  options : {
    urlPath : {
      default : '/contact-handler',
      matches : /^\/(?:[a-z0-9_-]+\/?)+$/
    }
  }
}

const stackConfig = async ({ cloudFormationTemplate, credentials, resourceTypes, settings, siteInfo }) => {
  let bucketName = convertDomainToBucketName(siteInfo.apexDomain) + '-lambda-functions'
  bucketName = await determineBucketName({ bucketName, credentials, findName : true, siteInfo })
  cloudFormationTemplate.Resources.SharedLambdaFunctionsS3Bucket = {
    Type       : 'AWS::S3::Bucket',
    Properties : {
      AccessControl : 'Private',
      BucketName    : bucketName
    }
  }
  resourceTypes.S3Bucket = true

  cloudFormationTemplate.Resources.ContactHandlerRole = {
    Type       : 'AWS::IAM::Role',
    Properties : {
      AssumeRolePolicyDocument : {
        Version   : '2012-10-17',
        Statement : [
          {
            Effect    : 'Allow',
            Principal : {
              Service : ['lambda.amazonaws.com']
            },
            Action : ['sts:AssumeRole']
          }
        ]
      },
      Path     : '/',
      Policies : [
        {
          PolicyName     : bucketName + '-contact-handler',
          PolicyDocument : {
            Version   : '2012-10-17',
            Statement : [
              {
                Effect   : 'Allow',
                Action   : '*',
                Resource : '*'
              }
            ]
          }
        }
      ]
    }
  }
  resourceTypes.IAMRole = true

  cloudFormationTemplate.Resources.ContactHandlerLambda = {
    Type : 'AWS::Lambda::Function',
    DependsOn: [ 'ContactHandlerRole', 'SharedLambdaFunctionsS3Bucket' ],
    Properties: {
      Code : {
        S3Bucket : bucketName,
        S3Key    : 'contact-lambda.zip'
      },
      Handler : 'index.handler',
      Role    : { 'Fn::GetAtt' : ['ContactHandlerRole', 'Arn'] },
      Runtime : 'nodejs20.x'
    }
  }
  resourceTypes.LambdaFunction = true
}

const contactHandler = { config, stackConfig }

export { contactHandler }
