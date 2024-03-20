import { CONTACT_HANDLER_ZIP_NAME } from './constants'
import { determineLambdaFunctionName } from './determine-lambda-function-name'
import { getSiteTag } from '../../../get-site-tag'

const setupContactHandler = async ({
  credentials,
  lambdaFunctionsBucketName,
  settings,
  siteInfo,
  siteTemplate,
  update
}) => {

  const { accountID, bucketName } = siteInfo
  const { finalTemplate, resourceTypes } = siteTemplate

  const contactHandlerFunctionName = update === true
    ? settings.contactHandlerFunctionName
    : (await determineLambdaFunctionName({
        baseName : lambdaFunctionsBucketName + '-contact-handler',
        credentials,
        siteTemplate
      }))
  settings.contactHandlerFunctionName = contactHandlerFunctionName

  const contactHandlerLogGroupName = contactHandlerFunctionName
  const contactHandlerPolicyName = contactHandlerFunctionName

  const siteTag = getSiteTag(siteInfo)
  const tags = [{ Key: siteTag, Value: '' }]

  finalTemplate.Resources.ContactHandlerRole = {
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
          PolicyName     : contactHandlerPolicyName,
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
      ],
      Tags: tags
    } // Properties
  }
  finalTemplate.Outputs.ContactHandlerRole = { Value : { Ref : 'ContactHandlerRole' } }
  resourceTypes['IAM::Role'] = true

  finalTemplate.Resources.ContactHandlerLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : contactHandlerLogGroupName,
      RetentionInDays : 180, // TODO: support options,
      Tags: tags
    }
  }

  finalTemplate.Resources.ContactHandlerLambdaFunction = {
    Type       : 'AWS::Lambda::Function',
    DependsOn  : ['ContactHandlerRole', 'ContactHandlerLogGroup'],
    Properties : {
      FunctionName : contactHandlerFunctionName,
      Description  : 'Handles contact form submissions; creates DynamoDB entry and sends email.',
      Code         : {
        S3Bucket : lambdaFunctionsBucketName,
        S3Key    : CONTACT_HANDLER_ZIP_NAME
      },
      Handler     : 'index.handler',
      Role        : { 'Fn::GetAtt' : ['ContactHandlerRole', 'Arn'] },
      Runtime     : 'nodejs20.x',
      MemorySize  : 128,
      Timeout     : 5,
      Environment : {
        Variables : { TABLE_PREFIX : bucketName }
      },
      LoggingConfig : {
        ApplicationLogLevel : 'INFO', // support options
        LogFormat           : 'JSON', // support options
        LogGroup            : contactHandlerLogGroupName,
        SystemLogLevel      : 'INFO' // support options
      },
      Tags: tags
    } // Properties
  }
  finalTemplate.Outputs.ContactHandlerLambdaFunction = { Value : { Ref : 'ContactHandlerLambdaFunction' } }
  resourceTypes['Lambda::Function'] = true

  finalTemplate.Resources.ContactHandlerLambdaPermission = {
    Type       : 'AWS::Lambda::Permission',
    DependsOn  : ['SiteCloudFrontDistribution', 'ContactHandlerLambdaFunction'],
    Properties : {
      Action              : 'lambda:InvokeFunctionUrl',
      Principal           : 'cloudfront.amazonaws.com',
      FunctionName        : contactHandlerFunctionName,
      FunctionUrlAuthType : 'AWS_IAM',
      SourceArn           : {
        'Fn::Join' : ['', [`arn:aws:cloudfront::${accountID}:distribution/`, { 'Fn::GetAtt' : ['SiteCloudFrontDistribution', 'Id'] }]]
      }
    }
  }

  finalTemplate.Resources.ContactHandlerLambdaURL = {
    Type       : 'AWS::Lambda::Url',
    DependsOn  : ['ContactHandlerLambdaFunction'],
    Properties : {
      AuthType : 'AWS_IAM',
      Cors     : {
        AllowCredentials : true,
        AllowHeaders     : ['*'],
        AllowMethods     : ['POST'],
        AllowOrigins     : ['*']
      },
      TargetFunctionArn : { 'Fn::GetAtt' : ['ContactHandlerLambdaFunction', 'Arn'] }
    }
  }
  finalTemplate.Outputs.ContactHandlerLambdaURL = { Value : { Ref : 'ContactHandlerLambdaURL' } }
  resourceTypes['Lambda::Url'] = true
}

export { setupContactHandler }
