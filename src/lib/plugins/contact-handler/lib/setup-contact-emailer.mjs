import { LambdaClient, UpdateFunctionCodeCommand } from '@aws-sdk/client-lambda'

import { CONTACT_EMAILER_ZIP_NAME, STANDARD_FORM_FIELDS } from './constants'
import { convertDomainToBucketName } from '../../../shared/convert-domain-to-bucket-name'
import { determineLambdaFunctionName } from './determine-lambda-function-name'
import { getSiteTag } from '../../../shared/get-site-tag'

const setupContactEmailer = async ({ credentials, lambdaFunctionsBucketName, update, pluginData, siteTemplate }) => {
  const { finalTemplate, siteInfo } = siteTemplate
  const { apexDomain } = siteInfo
  const { 
    emailFrom : contactHandlerFromEmail, 
    emailTo : contactHandlerTargetEmail, 
    formFields = 'standard'
  } = pluginData.settings

  if (contactHandlerFromEmail === undefined && contactHandlerTargetEmail !== undefined) {
    throw new Error("Found site setting for 'emailTo', but no 'emailFrom'; 'emailFrom' must be set to activate email functionality.")
  }

  // setup stream on table
  finalTemplate.Resources.ContactHandlerDynamoDB.Properties.StreamSpecification = {
    StreamViewType : 'NEW_IMAGE'
  }

  const emailerFunctionBaseName = convertDomainToBucketName(apexDomain) + '-contact-emailer'
  const emailerFunctionName = update
    ? pluginData.emailerFunctionName
    : (await determineLambdaFunctionName({
        baseName : emailerFunctionBaseName,
        credentials,
        siteTemplate
      }))
  pluginData.emailerFunctionName = emailerFunctionName
  const emailerFunctionLogGroupName = emailerFunctionName

  const formFieldsSpec = formFields === 'standard'
    ? JSON.stringify(STANDARD_FORM_FIELDS)
    : formFields

  const siteTag = getSiteTag(siteInfo)
  const tags = [{ Key : siteTag, Value : '' }]

  finalTemplate.Resources.ContactEmailerLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : emailerFunctionLogGroupName,
      RetentionInDays : 180 // TODO: support options
    }
  }

  finalTemplate.Resources.ContactEmailerRole = {
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
      Path     : '/cloudsite/contact-emailer/',
      Policies : [
        {
          PolicyName     : emailerFunctionName,
          PolicyDocument : {
            Version   : '2012-10-17',
            Statement : [
              {
                Effect   : 'Allow',
                Action   : ['ses:SendEmail', 'ses:SendEmailRaw', 'ses:GetSendQuota', 'ses:GetSendStatistics'],
                Resource : '*'
              }
            ]
          }
        }
      ],
      ManagedPolicyArns : [
        // AWSLambdaBasicExecutionRole: allows logging to CloudWatch
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        // Allows reading from DynamoDB streams
        'arn:aws:iam::aws:policy/service-role/AWSLambdaDynamoDBExecutionRole'
      ],
      Tags : tags
    } // Properties
  }

  finalTemplate.Resources.ContactEmailerFunction = {
    Type       : 'AWS::Lambda::Function',
    DependsOn  : ['ContactEmailerRole', 'ContactEmailerLogGroup'],
    Properties : {
      FunctionName : emailerFunctionName,
      Handler      : 'index.handler',
      Role         : { 'Fn::GetAtt' : ['ContactEmailerRole', 'Arn'] },
      Runtime      : 'nodejs20.x',
      MemorySize   : 128,
      Timeout      : 5,
      Code         : {
        S3Bucket : lambdaFunctionsBucketName,
        S3Key    : CONTACT_EMAILER_ZIP_NAME
      },
      Environment : {
        Variables : {
          APEX_DOMAIN                : apexDomain,
          EMAIL_HANDLER_SOURCE_EMAIL : contactHandlerFromEmail,
          FORM_FIELDS                : formFieldsSpec
          // EMAIL_HANDSER_TARGET_EMAIL will be added late if defined
        }
      },
      LoggingConfig : {
        ApplicationLogLevel : 'INFO', // support options
        LogFormat           : 'JSON', // support options
        LogGroup            : emailerFunctionLogGroupName,
        SystemLogLevel      : 'INFO' // support options
      },
      Tags : tags
    } // Properties
  }

  finalTemplate.Resources.ContactEmailerEventsSource = {
    Type       : 'AWS::Lambda::EventSourceMapping',
    DependsOn  : ['ContactEmailerFunction'],
    Properties : {
      FunctionName     : { 'Fn::GetAtt' : ['ContactEmailerFunction', 'Arn'] },
      EventSourceArn   : { 'Fn::GetAtt' : ['ContactHandlerDynamoDB', 'StreamArn'] },
      StartingPosition : 'LATEST'
    }
  }

  if (contactHandlerTargetEmail !== undefined) {
    finalTemplate.Resources.ContactEmailerFunction.Properties.Environment.Variables.EMAIL_HANDLER_TARGET_EMAIL =
      contactHandlerTargetEmail
  }

  if (update === true) {
    const client = new LambdaClient({ credentials })
    const command = new UpdateFunctionCodeCommand({ // UpdateFunctionCodeRequest
      FunctionName: emailerFunctionName,
      S3Bucket : lambdaFunctionsBucketName,
      S3Key    : CONTACT_EMAILER_ZIP_NAME
      // Publish: true || false,
    })
    await client.send(command);
  }
}

export { setupContactEmailer }
