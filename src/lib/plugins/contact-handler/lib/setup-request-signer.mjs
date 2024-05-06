import { REQUEST_SIGNER_ZIP_NAME } from './constants'
import { convertDomainToBucketName } from '../../../shared/convert-domain-to-bucket-name'
import { determineLambdaFunctionName } from '../../shared/determine-lambda-function-name'
import { getResourceTags } from '../../../shared/get-resource-tags'

const setupRequestSigner = async ({ credentials, lambdaFunctionsBucketName, pluginData, update, siteTemplate }) => {
  const { finalTemplate, siteInfo } = siteTemplate
  const { apexDomain } = siteInfo

  const tags = getResourceTags({ funcDesc: 'sign database entry request', siteInfo })

  const requestSignerFunctionBaseName = convertDomainToBucketName(apexDomain) + '-request-signer'
  const requestSignerFunctionName = update === true
    ? pluginData.requestSignerFunctionName
    : (await determineLambdaFunctionName({
        baseName : requestSignerFunctionBaseName,
        credentials,
        siteTemplate
      }))
  pluginData.requestSignerFunctionName = requestSignerFunctionName

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
      Path     : '/cloudsite/request-signer/',
      Policies : [
        {
          PolicyName     : requestSignerFunctionName,
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
      ManagedPolicyArns : ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      Tags              : tags
    } // Properties
  }

  finalTemplate.Resources.RequestSignerLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : requestSignerFunctionName,
      RetentionInDays : 180, // TODO: support options,
      Tags            : tags
    }
  }

  finalTemplate.Resources.SignRequestFunction = {
    Type       : 'AWS::Lambda::Function',
    DependsOn  : ['RequestSignerRole'],
    Properties : {
      FunctionName : requestSignerFunctionName,
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
        LogGroup            : requestSignerFunctionName,
        SystemLogLevel      : 'INFO' // support options
      },
      Tags : tags
    } // Properties
  }

  finalTemplate.Resources.SignRequestFunctionVersion = {
    Type       : 'AWS::Lambda::Version',
    DependsOn  : ['SignRequestFunction'],
    Properties : {
      FunctionName : { 'Fn::GetAtt' : ['SignRequestFunction', 'Arn'] }
    }
  }

  finalTemplate.Outputs.SignRequestFunction = {
    Value : { Ref : 'SignRequestFunction' }
  }
}

export { setupRequestSigner }
