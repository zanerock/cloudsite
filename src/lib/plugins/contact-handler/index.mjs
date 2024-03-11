import * as fsPath from 'node:path'
import * as fs from 'node:fs'

import { emailRE } from 'regex-repo'

import { CreateBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { convertDomainToBucketName } from '../../shared/convert-domain-to-bucket-name'
import { determineBucketName } from '../../shared/determine-bucket-name'

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
  const { credentials, finalTemplate, resourceTypes, siteInfo } = siteTemplate
  const { accountID, apexDomain, region } = siteInfo
  const contactHandlerPath = settings.path
  const contactHandlerFromEmail = settings.email
  const contactHandlerTargetEmail = settings.emailTo

  let lambdaFunctionsBucketName = convertDomainToBucketName(apexDomain) + '-lambda-functions'
  lambdaFunctionsBucketName =
    await determineBucketName({ bucketName: lambdaFunctionsBucketName, credentials, findName : true, siteInfo })

  const s3Client = new S3Client({ credentials, region })
  const createBucketCommand = new CreateBucketCommand({
    ACL    : 'private',
    Bucket : lambdaFunctionsBucketName
  })
  await s3Client.send(createBucketCommand)

  const putCommands = []

  const contactHandlerZipName = 'contact-handler-lambda.zip'
  const contactHandlerZipPath = fsPath.join(__dirname, contactHandlerZipName)
  const readStream = fs.createReadStream(contactHandlerZipPath)

  const putObjectCommandCH = new PutObjectCommand({
    Body        : readStream,
    Bucket      : lambdaFunctionsBucketName,
    Key         : contactHandlerZipName,
    ContentType : 'application/zip'
  })
  putCommands.push(() => s3Client.send(putObjectCommandCH))

  const requestSignerZipName = 'request-signer-lambda.zip'
  const requestSignerZipPath = fsPath.join(__dirname, requestSignerZipName)
  const rsReadStream = fs.createReadStream(requestSignerZipPath)

  const putObjectCommandRS = new PutObjectCommand({
    Body        : rsReadStream,
    Bucket      : lambdaFunctionsBucketName,
    Key         : requestSignerZipName,
    ContentType : 'application/zip'
  })
  putCommands.push(() => s3Client.send(putObjectCommandRS))

  const contactEmailerZipName = 'contact-emailer-lambda.zip'
  if (contactHandlerFromEmail !== undefined) {
    const contactEmailerZipPath = fsPath.join(__dirname, contactEmailerZipName)
    const ceReadStream = fs.createReadStream(contactEmailerZipPath)

    const putObjectCommandCE = new PutObjectCommand({
      Body        : ceReadStream,
      Bucket      : lambdaFunctionsBucketName,
      Key         : contactEmailerZipName,
      ContentType : 'application/zip'
    })
    putCommands.push(() => s3Client.send(putObjectCommandCE))
  }

  await Promise.all(putCommands.map((c) => c()))

  /* finalTemplate.Resources.SharedLambdaFunctionsS3Bucket = {
    Type       : 'AWS::S3::Bucket',
    Properties : {
      AccessControl : 'Private',
      BucketName    : lambdaFunctionsBucketName
    }
  }
  resourceTypes.S3Bucket = true */

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
  resourceTypes.IAMRole = true

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
        S3Key    : contactHandlerZipName
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
  resourceTypes.LambdaFunction = true

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
  resourceTypes.DynamoDBTable = true

  // add the email trigger on new DynamoDB entries
  if (contactHandlerFromEmail !== undefined) {
    // setup stream on table
    finalTemplate.Resources.ContactHandlerDynamoDB.StreamSpecification = {
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
        // AWSLambdaBasicExecutionRole: allows logging to CloudWatch
        ManagedPolicyArns : ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole']
      }
    }

    finalTemplate.Resources.ContactEmailerFunction = {
      Type       : 'AWS::Serverless::Function',
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
          S3Key    : contactEmailerZipName
        },
        Environment: {
          Variables: {
            EMAIL_HANDLER_SOURCE_EMAIL: contactHandlerFromEmail
          }
        },
        Events: {
          ContactFormEntriesEvent: {
            Type: 'DynamoDB',
            Properties: {
              StartingPosition: 'LATEST',
              Stream: { 'Fn::GetAtt': ['ContactHandlerDynamoDB', 'StreamArn'] }
            }
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
        S3Key    : requestSignerZipName
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
