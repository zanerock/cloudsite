import * as fsPath from 'node:path'
import * as fs from 'node:fs'

import { CreateBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

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

const stackConfig = async ({ siteTemplate, settings }) => {
  const { credentials, finalTemplate, resourceTypes, siteInfo } = siteTemplate
  const { accountID, apexDomain, region } = siteInfo
  const contactHandlerPath = settings.path

  let bucketName = convertDomainToBucketName(apexDomain) + '-lambda-functions'
  bucketName = await determineBucketName({ bucketName, credentials, findName : true, siteInfo })

  const s3Client = new S3Client({ credentials, region })
  const createBucketCommand = new CreateBucketCommand({
    ACL    : 'private',
    Bucket : bucketName
  })
  await s3Client.send(createBucketCommand)

  const contactHandlerZipName = 'contact-handler-lambda.zip'
  const contactHandlerZipPath = fsPath.join(__dirname, contactHandlerZipName)
  const readStream = fs.createReadStream(contactHandlerZipPath)

  const putObjectCommandCH = new PutObjectCommand({
    Body        : readStream,
    Bucket      : bucketName,
    Key         : contactHandlerZipName,
    ContentType : 'application/zip'
  })
  await s3Client.send(putObjectCommandCH)

  const requestSignerZipName = 'request-signer-lambda.zip'
  const requestSignerZipPath = fsPath.join(__dirname, requestSignerZipName)
  const rsReadStream = fs.createReadStream(requestSignerZipPath)

  const putObjectCommandRS = new PutObjectCommand({
    Body        : rsReadStream,
    Bucket      : bucketName,
    Key         : requestSignerZipName,
    ContentType : 'application/zip'
  })
  await s3Client.send(putObjectCommandRS)

  /* finalTemplate.Resources.SharedLambdaFunctionsS3Bucket = {
    Type       : 'AWS::S3::Bucket',
    Properties : {
      AccessControl : 'Private',
      BucketName    : bucketName
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
  finalTemplate.Outputs.ContactHandlerRole = { Value : { Ref : 'ContactHandlerRole' } }
  resourceTypes.IAMRole = true

  finalTemplate.Resources.RequestSignerRole = {
    Type       : 'AWS::IAM::Role',
    DependsOn : ['ContactHandlerLambdaFunction'],
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
          PolicyName     : bucketName + '-request-signer',
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
      ManagedPolicyArns: [ 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' ]
    }
  }

  const lambdaLogGroupName = bucketName + '-contact-handler-lambda-function'
  finalTemplate.Resources.ContactHandlerLogGroup = {
    Type       : 'AWS::Logs::LogGroup',
    Properties : {
      LogGroupClass   : 'STANDARD', // TODO: support option for INFREQUENT_ACCESS
      LogGroupName    : lambdaLogGroupName,
      RetentionInDays : 180 // TODO: support options
    }
  }

  const lambdaFunctionName = bucketName + '-contact-handler'
  finalTemplate.Resources.ContactHandlerLambdaFunction = {
    Type       : 'AWS::Lambda::Function',
    DependsOn  : ['ContactHandlerRole', 'ContactHandlerLogGroup'],
    Properties : {
      FunctionName : bucketName + '-contact-handler',
      Description  : 'Handles contact form submissions; creates DynamoDB entry and sends email.',
      Code         : {
        S3Bucket : bucketName,
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
        LogGroup            : lambdaLogGroupName,
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
      FunctionName        : lambdaFunctionName,
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
    AllowedMethods       : ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    CachePolicyId        : '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // caching disabled managed policy
    PathPattern          : contactHandlerPath,
    TargetOriginId       : 'ContactHandlerLambdaOrigin',
    ViewerProtocolPolicy : 'https-only',
    LambdaFunctionAssociations: [
      {
        EventType : 'origin-request',
        IncludeBody : true,
        LambdaFunctionARN : { 'Fn::Join': [':', [
          { 'Fn::GetAtt': ['SignRequestFunction', 'Arn']},
          { 'Fn::GetAtt': ['SignRequestFunctionVersion', 'Version']}]
        ]}
      }
    ]
  })

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors = cfCacheBehaviors
  finalTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('SignRequestFunctionVersion')

  const signFunctionHandlerName = bucketName + '-request-signer'
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
        S3Bucket : bucketName,
        S3Key    : requestSignerZipName
      },
      LoggingConfig : {
        ApplicationLogLevel : 'INFO', // support options
        LogFormat           : 'JSON', // support options
        LogGroup            : lambdaLogGroupName,
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
