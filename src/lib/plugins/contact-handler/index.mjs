import { emailRE } from 'regex-repo'

import { CONTACT_EMAILER_ZIP_NAME, CONTACT_HANDLER_ZIP_NAME, REQUEST_SIGNER_ZIP_NAME } from './lib/constants'
import { stageLambdaFunctionZipFiles } from './lib/stage-lambda-function-zip-files'

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
  const { finalTemplate, resourceTypes, siteInfo } = siteTemplate
  const { accountID } = siteInfo
  const contactHandlerPath = settings.path
  const contactHandlerFromEmail = settings.emailFrom
  const contactHandlerTargetEmail = settings.emailTo
  const enableEmail = !!contactHandlerFromEmail

  if (enableEmail !== true && contactHandlerTargetEmail) {
    throw new Error("Found site setting for 'emailTo', but no 'emailFrom'; 'emailFrom' must be set to activate email functionality.")
  }

  const { lambdaFunctionsBucketName } = await stageLambdaFunctionZipFiles({ enableEmail, siteInfo })

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
          PolicyName     : lambdaFunctionsBucketName + '-contact-handler',
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
  finalTemplate.Outputs.ContactHandlerRole = { Value : { Ref : 'ContactHandlerRole' } }
  resourceTypes['IAM::Role'] = true

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

  const contactHandlerLogGroupName = lambdaFunctionsBucketName + '-contact-handler'

  finalTemplate.Resources.ContactHandlerLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : contactHandlerLogGroupName,
      RetentionInDays : 180 // TODO: support options
    }
  }

  const contactHandlerFunctionName = contactHandlerLogGroupName
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
      Handler       : 'index.handler',
      Role          : { 'Fn::GetAtt' : ['ContactHandlerRole', 'Arn'] },
      Runtime       : 'nodejs20.x',
      MemorySize    : 128,
      Timeout       : 5,
      LoggingConfig : {
        ApplicationLogLevel : 'INFO', // support options
        LogFormat           : 'JSON', // support options
        LogGroup            : contactHandlerLogGroupName,
        SystemLogLevel      : 'INFO' // support options
      }
    }
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

  finalTemplate.Resources.ContactHandlerDynamoDB = {
    Type       : 'AWS::DynamoDB::Table',
    Properties : {
      TableName            : 'ContactFormEntries',
      AttributeDefinitions : [
        { AttributeName : 'SubmissionID', AttributeType : 'S' },
        { AttributeName : 'SubmissionTime', AttributeType : 'S' }
      ],
      KeySchema : [
        { AttributeName : 'SubmissionID', KeyType : 'HASH' },
        { AttributeName : 'SubmissionTime', KeyType : 'RANGE' }
      ],
      BillingMode : 'PAY_PER_REQUEST'
    }
  }

  finalTemplate.Outputs.ContactHandlerDynamoDB = { Value : { Ref : 'ContactHandlerDynamoDB' } }
  resourceTypes['DynamoDB::Table'] = true

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

  // update the CloudFront Distribution configuration
  finalTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('ContactHandlerLambdaURL')

  const cfOrigins = finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Origins
  cfOrigins.push({
    Id         : 'ContactHandlerLambdaOrigin',
    DomainName : { // strip the https://
      'Fn::Select' : [2, { 'Fn::Split' : ['/', { 'Fn::GetAtt' : ['ContactHandlerLambdaURL', 'FunctionUrl'] }] }]
    },
    CustomOriginConfig : {
      HTTPSPort            : 443,
      OriginProtocolPolicy : 'https-only'
    }
  })

  const cfCacheBehaviors = finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors || []
  cfCacheBehaviors.push({
    AllowedMethods             : ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    CachePolicyId              : '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // caching disabled managed policy
    PathPattern                : contactHandlerPath,
    TargetOriginId             : 'ContactHandlerLambdaOrigin',
    ViewerProtocolPolicy       : 'https-only',
    LambdaFunctionAssociations : [
      {
        EventType         : 'origin-request',
        IncludeBody       : true,
        LambdaFunctionARN : {
          'Fn::Join' : [':', [
            { 'Fn::GetAtt' : ['SignRequestFunction', 'Arn'] },
            { 'Fn::GetAtt' : ['SignRequestFunctionVersion', 'Version'] }]
          ]
        }
      }
    ]
  })

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors = cfCacheBehaviors
  finalTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('SignRequestFunctionVersion')

  const signFunctionHandlerName = lambdaFunctionsBucketName + '-request-signer'
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
        LogGroup            : contactHandlerLogGroupName,
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

const contactHandler = { config, stackConfig }

export { contactHandler }
