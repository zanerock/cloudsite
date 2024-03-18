import { REQUEST_SIGNER_ZIP_NAME } from './constants'
import { determineLambdaFunctionName } from './determine-lambda-function-name'

const setupRequestSigner = async ({ credentials, lambdaFunctionsBucketName, update, settings, siteTemplate }) => {
  console.log('setupRequestSigner update:', update) // DEBUG
  const { finalTemplate } = siteTemplate

  finalTemplate.Resources.RequestSignerRole = {
    Type       : 'AWS::IAM::Role',
    DependsOn  : ['ContactHandlerLambdaFunction'],
    Properties : {
      AssumeRolePolicyDocument : {
        Version   : '2012-10-17',
        Statement : [
          {
            Effect    : 'Allow',
            Principal : { Service : ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'] },
            Action    : ['sts:AssumeRole']
          }
        ]
      },
      Path     : '/',
      Policies : [
        {
          PolicyName     : lambdaFunctionsBucketName + '-request-signer',
          PolicyDocument : {
            Version   : '2012-10-17',
            Statement : [
              {
                Effect   : 'Allow',
                Action   : 'lambda:InvokeFunctionUrl',
                Resource : { 'Fn::GetAtt' : ['ContactHandlerLambdaFunction', 'Arn'] }
              }
            ]
          }
        }
      ],
      // AWSLambdaBasicExecutionRole: allows logging to CloudWatch
      ManagedPolicyArns : ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']
    }
  }

  const signFunctionHandlerName = update === true
    ? settings.requestSignerFunctionName
    : (await determineLambdaFunctionName({
        baseName : lambdaFunctionsBucketName + '-request-signer',
        credentials,
        siteTemplate
      }))
  settings.requestSignerFunctionName = signFunctionHandlerName

  finalTemplate.Resources.RequestSignerLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : signFunctionHandlerName,
      RetentionInDays : 180 // TODO: support options
    }
  }

  finalTemplate.Resources.SignRequestFunction = {
    Type       : 'AWS::Lambda::Function',
    DependsOn  : ['RequestSignerRole'],
    Properties : {
      FunctionName : signFunctionHandlerName,
      Handler      : 'index.handler',
      Role         : { 'Fn::GetAtt' : ['RequestSignerRole', 'Arn'] },
      Runtime      : 'nodejs20.x',
      MemorySize   : 128,
      Timeout      : 5,
      Code         : {
        S3Bucket : lambdaFunctionsBucketName,
        S3Key    : REQUEST_SIGNER_ZIP_NAME
      },
      LoggingConfig : {
        ApplicationLogLevel : 'INFO', // support options
        LogFormat           : 'JSON', // support options
        LogGroup            : signFunctionHandlerName,
        SystemLogLevel      : 'INFO' // support options
      }
    }
  }

  finalTemplate.Resources.SignRequestFunctionVersion = {
    Type       : 'AWS::Lambda::Version',
    DependsOn  : ['SignRequestFunction'],
    Properties : {
      FunctionName : { 'Fn::GetAtt' : ['SignRequestFunction', 'Arn'] }
    }
  }
}

export { setupRequestSigner }
