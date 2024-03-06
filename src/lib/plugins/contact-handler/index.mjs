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

const stackConfig = async ({ cloudFormationTemplate, credentials, resourceTypes, settings, siteInfo }) => {
  const { apexDomain, region } = siteInfo

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

  const putObjectCommand = new PutObjectCommand({
    Body        : readStream,
    Bucket      : bucketName,
    Key         : contactHandlerZipName,
    ContentType : 'application/zip'
  })
  await s3Client.send(putObjectCommand)

  /* cloudFormationTemplate.Resources.SharedLambdaFunctionsS3Bucket = {
    Type       : 'AWS::S3::Bucket',
    Properties : {
      AccessControl : 'Private',
      BucketName    : bucketName
    }
  }
  resourceTypes.S3Bucket = true */

  cloudFormationTemplate.Resources.ContactHandlerRole = {
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
  cloudFormationTemplate.Outputs.ContactHandlerRole = { Value : { Ref : 'ContactHandlerRole' }}
  resourceTypes.IAMRole = true

  cloudFormationTemplate.Resources.ContactHandlerLambda = {
    Type       : 'AWS::Lambda::Function',
    DependsOn  : ['ContactHandlerRole'],
    Properties : {
      Code : {
        S3Bucket : bucketName,
        S3Key    : contactHandlerZipName
      },
      Handler : 'index.handler',
      Role    : { 'Fn::GetAtt' : ['ContactHandlerRole', 'Arn'] },
      Runtime : 'nodejs20.x'
    }
  }
  cloudFormationTemplate.Outputs.ContactHandlerLambda = { Value : { Ref : 'ContactHandlerLambda' }}
  resourceTypes.LambdaFunction = true

  cloudFormationTemplate.Resources.ContactHandlerLambdaURL = {
    Type       : 'AWS::Lambda::Url',
    DependsOn  : ['ContactHandlerLambda'],
    Properties : {
      AuthType          : 'NONE',
      // Cors : Cors,
      TargetFunctionArn : { 'Fn::GetAtt' : ['ContactHandlerLambda', 'Arn'] }
    }
  }
  cloudFormationTemplate.Outputs.ContactHandlerLambdaURL = { Value : { Ref : 'ContactHandlerLambdaURL' }}

  cloudFormationTemplate.Resources.ContactHandlerDynamoDB = {
    Type       : 'AWS::DynamoDB::Table',
    Properties : {
      TableName : 'ContactFormEntries',
      AttributeDefinitions : [{
        AttributeName: 'SubmissionID',
        AttributeType: 'S'
      }],
      KeySchema : [{
        AttributeName : 'SubmissionID',
        KeyType       : 'HASH'
      }],
      BillingMode: 'PAY_PER_REQUEST'
    }
  }
  cloudFormationTemplate.Outputs.ContactHandlerDynamoDB = { Value : { Ref : 'ContactHandlerDynamoDB' }}
  resourceTypes.DynamoDBTable = true

  // update the CloudFront Distribution configuration
  cloudFormationTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('ContactHandlerLambdaURL')

  const cfOrigins = cloudFormationTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Origins
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

  const cfCacheBehaviors = cloudFormationTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors || []
  cfCacheBehaviors.push({
    AllowedMethods : [ 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT' ],
    CachePolicyId  : '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // caching disabled managed policy
    PathPattern    : '/contact-handler',
    TargetOriginId : 'ContactHandlerLambdaOrigin',
    ViewerProtocolPolicy: 'https-only'
  })

  cloudFormationTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors = cfCacheBehaviors
}

const contactHandler = { config, stackConfig }

export { contactHandler }
