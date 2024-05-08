import { INDEX_REWRITER_ZIP_NAME } from './constants'
import { convertDomainToBucketName } from '../../../shared/convert-domain-to-bucket-name'
import { determineLambdaFunctionName } from '../../shared/determine-lambda-function-name'
import { getResourceTags } from '../../../shared/get-resource-tags'

const setupIndexRewriter = async ({ credentials, pluginData, siteTemplate, update }) => {
  const { finalTemplate, siteInfo } = siteTemplate
  const { apexDomain, lambdaFunctionsBucketName } = siteInfo

  const tags = getResourceTags({ funcDesc : 'rewrite directory URLs', siteInfo })

  const indexRewriterFunctionBaseName = convertDomainToBucketName(apexDomain) + '-index-rewriter'

  const indexRewriterFunctionName = update === true
    ? pluginData.indexRewriterFunctionName
    : (await determineLambdaFunctionName({
        baseName : indexRewriterFunctionBaseName,
        credentials,
        siteTemplate
      }))
  pluginData.indexRewriterFunctionName = indexRewriterFunctionName

  finalTemplate.Resources.IndexRewriterRole = {
    Type       : 'AWS::IAM::Role',
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
      Path              : '/cloudsite/index-rewriter/',
      /*      Policies : [
        {
          PolicyName     : indexRewriterFunctionName,
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
      ], */
      // AWSLambdaBasicExecutionRole: allows logging to CloudWatch
      ManagedPolicyArns : ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      Tags              : tags
    } // Properties
  }

  finalTemplate.Resources.IndexRewriterLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : indexRewriterFunctionName,
      RetentionInDays : 180, // TODO: support options,
      Tags            : tags
    }
  }

  finalTemplate.Resources.IndexRewriterFunction = {
    Type       : 'AWS::Lambda::Function',
    DependsOn  : ['IndexRewriterRole'],
    Properties : {
      FunctionName : indexRewriterFunctionName,
      Handler      : 'index.handler',
      Role         : { 'Fn::GetAtt' : ['IndexRewriterRole', 'Arn'] },
      Runtime      : 'nodejs20.x',
      MemorySize   : 128,
      Timeout      : 5,
      Code         : {
        S3Bucket : lambdaFunctionsBucketName,
        S3Key    : INDEX_REWRITER_ZIP_NAME
      },
      LoggingConfig : {
        ApplicationLogLevel : 'INFO', // support options
        LogFormat           : 'JSON', // support options
        LogGroup            : indexRewriterFunctionName,
        SystemLogLevel      : 'INFO' // support options
      },
      Tags : tags
    } // Properties
  }

  finalTemplate.Resources.IndexRewriterFunctionVersion = {
    Type       : 'AWS::Lambda::Version',
    DependsOn  : ['IndexRewriterFunction'],
    Properties : {
      FunctionName : { 'Fn::GetAtt' : ['IndexRewriterFunction', 'Arn'] }
    }
  }

  finalTemplate.Outputs.IndexRewriterFunction = {
    Value : { Ref : 'IndexRewriterFunction' }
  }
}

export { setupIndexRewriter }
