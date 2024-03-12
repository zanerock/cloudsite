import { emailRE } from 'regex-repo'

import { CONTACT_EMAILER_ZIP_NAME } from './lib/constants'
import { setupContactFormTable } from './lib/setup-contact-form-table'
import { setupContactHandler } from './lib/setup-contact-handler'
import { setupRequestSigner } from './lib/setup-request-signer'
import { stageLambdaFunctionZipFiles } from './lib/stage-lambda-function-zip-files'
import { updateCloudFrontDistribution } from './lib/update-cloud-front-distribution'

const config = {
  options : {
    email : {
      matches : emailRE
    },
    urlPath : {
      default : '/contact-handler',
      matches : /^\/(?:[a-z0-9_-]+\/?)+$/
    }
  }
}

const stackConfig = async ({ siteTemplate, settings }) => {
  const { finalTemplate, siteInfo } = siteTemplate
  const contactHandlerFromEmail = settings.emailFrom
  const contactHandlerTargetEmail = settings.emailTo
  const enableEmail = !!contactHandlerFromEmail

  if (enableEmail !== true && contactHandlerTargetEmail) {
    throw new Error("Found site setting for 'emailTo', but no 'emailFrom'; 'emailFrom' must be set to activate email functionality.")
  }

  const lambdaFunctionsBucketName = await stageLambdaFunctionZipFiles({ enableEmail, siteInfo })

  setupContactHandler({ lambdaFunctionsBucketName, siteInfo })
  setupRequestSigner({ lambdaFunctionsBucketName, siteInfo })
  setupContactFormTable({ siteInfo })
  updateCloudFrontDistribution({ settings, siteInfo })

  // add the email trigger on new DynamoDB entries
  if (contactHandlerFromEmail !== undefined) {
    // setup stream on table
    finalTemplate.Resources.ContactHandlerDynamoDB.Properties.StreamSpecification = {
      StreamViewType : 'NEW_IMAGE'
    }

    const emailerFunctionName = lambdaFunctionsBucketName + '-contact-emailer'
    const emailerFunctionLogGroupName = emailerFunctionName

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
        Path     : '/',
        Policies : [
          {
            PolicyName     : lambdaFunctionsBucketName + '-contact-handler',
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
        ]
      }
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
            EMAIL_HANDLER_SOURCE_EMAIL : contactHandlerFromEmail
          }
        },
        LoggingConfig : {
          ApplicationLogLevel : 'INFO', // support options
          LogFormat           : 'JSON', // support options
          LogGroup            : emailerFunctionLogGroupName,
          SystemLogLevel      : 'INFO' // support options
        }
      }
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
  } // if (contactHandlerFromEmail !== undefined) {
}

const contactHandler = { config, stackConfig }

export { contactHandler }
