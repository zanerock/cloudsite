import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'

const iamPolicy = {
  Version   : '2012-10-17',
  Statement : [
    {
      Sid    : 'VisualEditor0',
      Effect : 'Allow',
      Action : [
        'acm:ListCertificates',
        'acm:RequestCertificate',
        'cloudformation:CreateStack',
        'cloudformation:DeleteStack',
        'cloudformation:DescribeStackDriftDetectionStatus',
        'cloudformation:DescribeStackEvents',
        'cloudformation:DescribeStacks',
        'cloudformation:DetectStackDrift',
        'cloudformation:GetTemplate',
        'cloudformation:ListChangeSets',
        'cloudformation:UpdateStack',
        'cloudfront:CreateDistribution',
        'cloudfront:CreateInvalidation',
        'cloudfront:CreateOriginAccessControl',
        'cloudfront:DeleteDistribution',
        'cloudfront:DeleteOriginAccessControl',
        'cloudfront:GetDistribution',
        'cloudfront:GetOriginAccessControl',
        'cloudfront:ListDistributions',
        'cloudfront:ListOriginAccessControls',
        'cloudfront:TagResource',
        'cloudfront:UpdateDistribution',
        'cloudfront:UpdateOriginAccessControl',
        'dynamodb:CreateTable',
        'dynamodb:DeleteTable',
        'dynamodb:DescribeTable',
        'dynamodb:UpdateTable',
        'iam:AttachRolePolicy',
        'iam:CreateRole',
        'iam:DeleteRole',
        'iam:DetachRolePolicy',
        'iam:DeleteRolePolicy',
        'iam:GetRole',
        'iam:PutRolePolicy',
        'iam:UpdateRole',
        'lambda:AddPermission',
        'lambda:CreateFunction',
        'lambda:CreateEventSourceMapping',
        'lambda:CreateFunctionUrlConfig',
        'lambda:DeleteEventSourceMapping',
        'lambda:DeleteFunction',
        'lambda:DeleteFunctionUrlConfig',
        'lambda:EnableReplication',
        'lambda:GetEventSourceMapping',
        'lambda:GetFunction',
        'lambda:GetFunctionConfiguration',
        'lambda:GetFunctionUrlConfig',
        'lambda:ListFunctions',
        'lambda:ListFunctionUrlConfigs',
        'lambda:ListVersionsByFunction',
        'iam:PassRole',
        'lambda:PublishVersion',
        'lambda:RemovePermission',
        'lambda:UpdateFunctionUrlConfig',
        'logs:CreateLogGroup',
        'logs:DeleteLogGroup',
        'logs:DeleteRetentionPolicy',
        'logs:PutRetentionPolicy',
        'route53:ListHostedZones',
        'route53:ChangeResourceRecordSets',
        'route53:ListResourceRecordSets',
        's3:CreateBucket',
        's3:PutObject',
        's3:DeleteObject',
        's3:DeleteBucket',
        's3:DeleteBucketPolicy',
        's3:GetObject',
        's3:ListAllMyBuckets',
        's3:ListBucket',
        's3:PutBucketAcl',
        's3:PutBucketPolicy',
        's3:*'
      ],
      Resource : [
        '*'
      ]
    }
  ]
}

const instructions =
`1. Log into the AWS console.
2. Select/navigate to the IAM service.
3. Select 'Policies' from the left hand menu options.
4. Select 'Create policy'.
5. Select the 'JSON' option.
6. Replace the JSON with the text below.`

const handleGetIAMPolicy = ({ argv }) => {
  const getIAMPolicyOptionsSpec = cliSpec.commands.find(({ name }) => name === 'get-iam-policy').arguments
  const getIAMPolicyOptions = commandLineArgs(getIAMPolicyOptionsSpec, { argv })
  const withInstructions = getIAMPolicyOptions['with-instructions']

  if (withInstructions === true) {
    process.stdout.write(instructions + '\n\n')
  }
  process.stdout.write(JSON.stringify(iamPolicy, null, '  ') + '\n')
}

export { handleGetIAMPolicy }
