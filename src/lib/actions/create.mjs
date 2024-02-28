import { ACMClient, ListCertificatesCommand, RequestCertificateCommand } from '@aws-sdk/client-acm'
import { CloudFrontClient, GetDistributionCommand } from '@aws-sdk/client-cloudfront'
import {
  CloudFormationClient,
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation'
import { Route53Client, ChangeResourceRecordSetsCommand, ListHostedZonesCommand } from '@aws-sdk/client-route-53'
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { fromIni } from '@aws-sdk/credential-providers'

const RECHECK_WAIT_TIME = 2000 // ms
const STACK_CREATE_TIMEOUT = 15 // min

const create = async ({
  apexDomain,
  bucketName,
  noDeleteOnFailure,
  region,
  sourcePath,
  /* sourceType, */
  siteInfo,
  ssoProfile
}) => {
  const credentials = fromIni({
    // Optional. The configuration profile to use. If not specified, the provider will use the value
    // in the `AWS_PROFILE` environment variable or a default of `default`.
    profile : ssoProfile
    // Optional. The path to the shared credentials file. If not specified, the provider will use
    // the value in the `AWS_SHARED_CREDENTIALS_FILE` environment variable or a default of
    // `~/.aws/credentials`.
    // filepath: "~/.aws/credentials",
    // Optional. The path to the shared config file. If not specified, the provider will use the
    // value in the `AWS_CONFIG_FILE` environment variable or a default of `~/.aws/config`.
    // configFilepath: "~/.aws/config",
    // Optional. A function that returns a a promise fulfilled with an MFA token code for the
    // provided MFA Serial code. If a profile requires an MFA code and `mfaCodeProvider` is not a
    // valid function, the credential provider promise will be rejected.
    /* mfaCodeProvider: async (mfaSerial) => {
      return "token";
    }, */
    // Optional. Custom STS client configurations overriding the default ones.
    // clientConfig: { region },
  })

  const acmClient = new ACMClient({
    credentials,
    region : 'us-east-1' // N. Virginia; required for certificate request
  })

  let { certificateArn, status } = await findCertificate({ acmClient, apexDomain })
  if (certificateArn === null) {
    process.stdout.write(`Creating wildcard certificate for '${apexDomain}'...`)
    certificateArn = await createCertificate({ acmClient, apexDomain, siteInfo })
    status = 'PENDING_VALIDATION'
  }
  siteInfo.certificateArn = certificateArn

  if (status === 'PENDING_VALIDATION') {
    const accountLocalCertID = certificateArn.replace(/[^/]+\/(.+)/, '$1')
    const certificateConsoleURL =
      `https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/${accountLocalCertID}`
    throw new Error(`Wildcard certificate for '${apexDomain}' found, but requires validation. Please validate the certificate. To validate on S3 when using Route 53 for DNS service, try navigating to the folliwng URL and select 'Create records in Route 53'::\n\n${certificateConsoleURL}\n\nSubsequent validation may take up to 30 minutes. For further documentation:\n\nhttps://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html`)
  }

  await determineBucketName({ apexDomain, bucketName, credentials, siteInfo })
  await createSiteStack({ credentials, noDeleteOnFailure, region, siteInfo })
}

const findCertificate = async ({ apexDomain, acmClient, nextToken }) => {
  process.stdout.write('Searching for existing certificate...\n')
  const listCertificateInput = { CertificateStatuses : ['PENDING_VALIDATION', 'ISSUED'] }
  const listCertificatesCommand = new ListCertificatesCommand(listCertificateInput)
  const listResponse = await acmClient.send(listCertificatesCommand)

  const domain = '*.' + apexDomain
  for (const { CertificateArn, DomainName, Status } of listResponse.CertificateSummaryList) {
    if (DomainName === domain) {
      return { certificateArn : CertificateArn, status : Status }
    }
  }
  nextToken = listResponse.NextToken
  if (nextToken !== undefined) {
    return await findCertificate({ apexDomain, acmClient, nextToken })
  }
  // else
  return { certificateArn : null, status : null }
}

const convertDomainToBucketName = (domain) => domain.replaceAll(/\./g, '-').replaceAll(/[^a-z0-9-]/g, 'x')

const createCertificate = async ({ acmClient, apexDomain, siteInfo }) => {
  process.stdout.write(`Creating wildcard certificate for '${apexDomain}'...`)
  const input = { // RequestCertificateRequest
    DomainName       : '*.' + apexDomain, // TODO: support more narrow cert?
    ValidationMethod : 'DNS', // TODO: support email
    SubjectAlternativeNames: [
      apexDomain, 'www.' + apexDomain
    ],/*
    // IdempotencyToken: "STRING_VALUE", TODO: should we use this?
    /* DomainValidationOptions: [ // DomainValidationOptionList : TODO: is this only used for email verification?
      { // DomainValidationOption
        DomainName: "STRING_VALUE", // required
        ValidationDomain: "STRING_VALUE", // required
      },
    ], */
    Options          : { // CertificateOptions
      CertificateTransparencyLoggingPreference : 'ENABLED'
    },
    // CertificateAuthorityArn: "STRING_VALUE", TODO: only used for private certs, I think
    /* Tags: [ // TagList : TODO: support tags? tag with the website
      { // Tag
        Key: "STRING_VALUE", // required
        Value: "STRING_VALUE",
      },
    ], */
    KeyAlgorithm : 'RSA_2048' // TODO: support key options"RSA_1024" || "RSA_2048" || "RSA_3072" || "RSA_4096" || "EC_prime256v1" || "EC_secp384r1" || "EC_secp521r1",
  }
  // this method can safely be called multiple times; it'll  match  existing certs (by domain name I'd assume)
  const command = new RequestCertificateCommand(input)
  const response = await acmClient.send(command)

  const { CertificateArn } = response

  return CertificateArn
}

const determineBucketName = async ({ apexDomain, bucketName, credentials, siteInfo }) => {
  process.stdout.write('Getting effective account ID...\n')
  const response = await new STSClient({ credentials }).send(new GetCallerIdentityCommand({}))
  const accountID = response.Account
  siteInfo.accountID = accountID

  if (bucketName === undefined) {
    bucketName = siteInfo.bucketName || convertDomainToBucketName(apexDomain)
  }
  // else, we use the explicit bucketName provided
  process.stdout.write(`Checking bucket '${bucketName}' is free...\n`)

  const s3Client = new S3Client({ credentials })
  const input = { Bucket : bucketName, ExpectedBucketOwner : accountID }

  const command = new HeadBucketCommand(input)
  try {
    const response = await s3Client.send(command)
    throw new Error(`Account already owns bucket '${bucketName}'; delete or specify alternate bucket name.`)
  } catch (e) {
    if (e.name === 'NotFound') {
      siteInfo.bucketName = bucketName
      return bucketName
    }
    // else
    throw e
  }
}

const createSiteStack = async ({ credentials, noDeleteOnFailure, region, siteInfo }) => {
  const { accountID, apexDomain, bucketName, certificateArn } = siteInfo
  siteInfo.region = region

  const cloudFormationTemplate = `AWSTemplateFormatVersion: 2010-09-09
Description: Static hosting using an S3 bucket and CloudFront.

Outputs:
  S3BucketName:
    Value:
      Ref: S3Bucket

  OriginAccessControl:
    Value:
      Ref: CloudFrontOriginAccessControl

  CloudFrontDist:
    Value:
      Ref: CloudFrontDistribution

Resources:
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: Private
      BucketName: "${bucketName}"

  CloudFrontOriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Description: "origin access control(OAC) for allowing cloudfront to access S3 bucket"
        Name: static-hosting-OAC
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    DependsOn:
      - S3Bucket
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: "${bucketName}.s3.${region}.amazonaws.com"
            Id: static-hosting
            S3OriginConfig:
              OriginAccessIdentity: ""
            OriginAccessControlId: !GetAtt CloudFrontOriginAccessControl.Id
        Enabled: "true"
        DefaultRootObject: index.html
        CustomErrorResponses:
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
        HttpVersion: http2
        Aliases:
          - ${apexDomain}
          - www.${apexDomain}
        ViewerCertificate:
          AcmCertificateArn: "${certificateArn}"
          MinimumProtocolVersion: TLSv1.2_2021
          SslSupportMethod: sni-only
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          Compress: true
          TargetOriginId: static-hosting
          ForwardedValues:
            QueryString: "false"
            Cookies:
              Forward: none
          ViewerProtocolPolicy: redirect-to-https

  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    DependsOn:
      - S3Bucket
      - CloudFrontDistribution
    Properties:
      Bucket: '${bucketName}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: 'cloudfront.amazonaws.com'
            Action: 's3:GetObject'
            Resource: 'arn:aws:s3:::${bucketName}/*'
            Condition:
              StringEquals:
                AWS:SourceArn: !Join ['', [ 'arn:aws:cloudfront::${accountID}:distribution/', !GetAtt CloudFrontDistribution.Id ]]
`

  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const stackName = convertDomainToBucketName(apexDomain) + '-stack'
  const createInput = {
    StackName       : stackName,
    TemplateBody    : cloudFormationTemplate,
    DisableRollback : false,
    Capabilities    : ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
    TimeoutInMinutes : STACK_CREATE_TIMEOUT
  }
  const createCommand = new CreateStackCommand(createInput)
  const createResponse = await cloudFormationClient.send(createCommand)

  const { StackId } = createResponse

  siteInfo.stackName = stackName
  siteInfo.stackArn = StackId

  const stackCreated = await trackStackCreationStatus({ cloudFormationClient, noDeleteOnFailure, stackName })

  if (stackCreated === true) {
    const describeInput = { StackName : stackName }
    const describeCommand = new DescribeStacksCommand(describeInput)
    const describeResponse = await cloudFormationClient.send(describeCommand)
    const cloudFrontID = describeResponse
      .Stacks[0].Outputs.find(({ OutputKey }) => OutputKey === 'CloudFrontDist').OutputValue

    const cloudFrontClient = new CloudFrontClient({ credentials, region })
    const getDistributionCommand = new GetDistributionCommand({ Id: cloudFrontID })
    const distributionResponse = await cloudFrontClient.send(getDistributionCommand)
    const distributionDomainName = distributionResponse.Distribution.DomainName
    
    const route53Client = new Route53Client({ credentials, region })
    const hostedZoneID = await getHostedZoneID({ credentials, route53Client, siteInfo })
    console.log('hostedZoneID:', hostedZoneID) // DEBUG

    const changeResourceRecordSetCommand = new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneID,
      ChangeBatch: {
        Comment: `Point '${apexDomain}' and 'www.${apexDomain}' to CloudFront distribution.`,
        Changes: [
          {
            Action: 'CREATE',
            ResourceRecordSet: {
              Name: apexDomain,
              AliasTarget: { 
                DNSName: distributionDomainName, 
                EvaluateTargetHealth: false, 
                HostedZoneId: 'Z2FDTNDATAQYW2' // Static value specified by API for use with CloudFront aliases
              },
              Type: 'A'
            }
          },
          {
            Action: 'CREATE',
            ResourceRecordSet: {
              Name: 'www.' + apexDomain,
              AliasTarget: { 
                DNSName: distributionDomainName, 
                EvaluateTargetHealth: false, 
                HostedZoneId: 'Z2FDTNDATAQYW2' // Static value specified by API for use with CloudFront aliases
              },
              Type: 'A'
            }
          }
        ]
      }
    })
    const changeResourceRecordSetResponse = await route53Client.send(changeResourceRecordSetCommand)
    console.log('changeResourceRecordSetResponse:', JSON.stringify(changeResourceRecordSetResponse, null, '  ')) // DEBUG
  }
  else {
    process.stdout.write('Stack creation error.\n')
  }
}

const getHostedZoneID = async({ markerToken, route53Client, siteInfo }) => {
  const listHostedZonesCommand = new ListHostedZonesCommand({ marker: markerToken })
  const listHostedZonesResponse = await route53Client.send(listHostedZonesCommand)

  for (const { Id, Name } of listHostedZonesResponse.HostedZones) {
    console.log(`Looking at ${Name} (${Id}...`) // DEBUG
    if (Name === siteInfo.apexDomain + '.') {
      return Id.replace(/\/[^/]+\/(.+)/, '$1') // /hostedzone/XXX -> XXX
    }
  }

  if (listHostedZonesResponse.IsTruncated === true) {
    return await getHostedZoneID({ markerToken: listHostedZonesResponse.NewMarker, route53Client, siteInfo })
  }
}

const trackStackCreationStatus = async ({ cloudFormationClient, noDeleteOnFailure, stackName }) => {
  let stackStatus, previousStatus
  do {
    const describeInput = { StackName : stackName }
    const describeCommand = new DescribeStacksCommand(describeInput)
    const describeResponse = await cloudFormationClient.send(describeCommand)

    stackStatus = describeResponse.Stacks[0].StackStatus

    if (stackStatus === 'CREATE_IN_PROGRESS' && previousStatus === undefined) {
      process.stdout.write('Creating stack')
    }
    else if (stackStatus === 'ROLLBACK_IN_PROGRESS' && previousStatus !== 'ROLLBACK_IN_PROGRESS') {
      process.stdout.write('\nRollback in progress')
    }
    else {
      process.stdout.write('.')
    }
    
    previousStatus = stackStatus
    await new Promise(resolve => setTimeout(resolve, RECHECK_WAIT_TIME))
  } while (stackStatus.match(/_IN_PROGRESS$/))

  if (stackStatus === 'ROLLBACK_COMPLETE' && noDeleteOnFailure !== true) {
    process.stdout.write(`\nDeleting stack '${stackName}'... `)
    const deleteInput = { StackName : stackName }
    const deleteCommand = new DeleteStackCommand(deleteInput)
    const deleteResponse = await cloudFormationClient.send(deleteCommand)

    process.stdout.write('done.\n')
  } else {
    process.stdout.write('\nStack status: ' + stackStatus + '\n')
  }

  return stckStatus === 'CREATE_COMPLETE'
}

export { create }
