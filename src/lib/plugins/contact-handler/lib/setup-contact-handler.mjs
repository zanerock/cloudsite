import { LambdaClient, UpdateFunctionCodeCommand } from '@aws-sdk/client-lambda'

import { CONTACT_HANDLER_ZIP_NAME, STANDARD_FORM_FIELDS } from './constants'
import { convertDomainToBucketName } from '../../../shared/convert-domain-to-bucket-name'
import { determineLambdaFunctionName } from '../../shared/determine-lambda-function-name'
import { getResourceTags } from '../../../shared/get-resource-tags'

const setupContactHandler = async ({
  credentials,
  lambdaFunctionsBucketName,
  pluginData,
  siteInfo,
  siteTemplate,
  update
}) => {
  const { accountID, apexDomain, region } = siteInfo
  const { finalTemplate, resourceTypes } = siteTemplate

  const contactHandlerFunctionBaseName = convertDomainToBucketName(apexDomain) + '-contact-handler'
  const contactHandlerFunctionName = update === true
    ? pluginData.contactHandlerFunctionName
    : (await determineLambdaFunctionName({
        baseName : contactHandlerFunctionBaseName,
        credentials,
        siteTemplate
      }))
  pluginData.contactHandlerFunctionName = contactHandlerFunctionName

  const contactHandlerLogGroupName = contactHandlerFunctionName
  const contactHandlerPolicyName = contactHandlerFunctionName

  const { formFields = 'standard' } = pluginData.settings
  const formFieldsSpec = formFields === 'standard'
    ? JSON.stringify(STANDARD_FORM_FIELDS)
    : formFields

  const tags = getResourceTags({ funcDesc : 'enter contact form record in database', siteInfo })

  finalTemplate.Resources.ContactHandlerLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : contactHandlerLogGroupName,
      RetentionInDays : 180, // TODO: support options,
      Tags            : tags
    }
  }

  finalTemplate.Resources.ContactHandlerRole = {
    Type       : 'AWS::IAM::Role',
    DependsOn  : ['ContactHandlerDynamoDB', 'ContactHandlerLogGroup'],
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
      Path     : '/cloudsite/contact-processor/',
      Policies : [
        {
          PolicyName     : contactHandlerPolicyName,
          PolicyDocument : {
            Version   : '2012-10-17',
            Statement : [
              {
                Action : [
                  'dynamodb:PutItem'
                ],
                Resource : { 'Fn::GetAtt' : ['ContactHandlerDynamoDB', 'Arn'] },
                Effect   : 'Allow'
              },
              {
                Effect   : 'Allow',
                Action   : 'logs:CreateLogGroup',
                Resource : `arn:aws:${region}:${accountID}:*`
              },
              {
                Effect : 'Allow',
                Action : [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents'
                ],
                Resource : [
                  `arn:aws:logs:${region}:${accountID}:log-group:${contactHandlerLogGroupName}:*`
                ]
              }
            ]
          }
        }
      ],
      Tags : tags
    } // Properties
  }
  finalTemplate.Outputs.ContactHandlerRole = { Value : { Ref : 'ContactHandlerRole' } }
  resourceTypes['IAM::Role'] = true

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
        Variables : {
          TABLE_PREFIX : apexDomain,
          FORM_FIELDS  : formFieldsSpec
        }
      },
      LoggingConfig : {
        ApplicationLogLevel : 'INFO', // support options
        LogFormat           : 'JSON', // support options
        LogGroup            : contactHandlerLogGroupName,
        SystemLogLevel      : 'INFO' // support options
      },
      Tags : tags
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

  if (update === true) {
    const client = new LambdaClient({ credentials })
    const command = new UpdateFunctionCodeCommand({ // UpdateFunctionCodeRequest
      FunctionName : contactHandlerFunctionName,
      S3Bucket     : lambdaFunctionsBucketName,
      S3Key        : CONTACT_HANDLER_ZIP_NAME
      // Publish: true || false,
    })
    await client.send(command)
  }
}

export { setupContactHandler }
