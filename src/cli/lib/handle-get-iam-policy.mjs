import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { getAccountID } from '../../lib/shared/get-account-id'
import { getCredentials } from '../../lib/actions/lib/get-credentials' // TODO: move to shared

const generateIAMPolicy = async (globalOptions) => {
  // TODO: once we refactor 'sites.json' into 'cloudsite-db.json', with 'accountID' at the top level, we can pass that
  // in here and avoid the 'getAccountID' call in many cases
  const credentials = getCredentials(globalOptions)
  const accountID = await getAccountID({ credentials })

  return {
    Version   : '2012-10-17',
    Statement : [
      {
        Sid    : 'CloudsiteAcmGrants',
        Effect : 'Allow',
        Action : [
          'acm:ListCertificates',
          'acm:RequestCertificate'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteCostExplorerGrants',
        Effect : 'Allow',
        Action : [
          'ce:UpdateCostAllocationTagsStatus'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteCloudFormationGrants',
        Effect : 'Allow',
        Action : [
          'cloudformation:CreateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStackDriftDetectionStatus',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStacks',
          'cloudformation:DetectStackDrift',
          'cloudformation:GetTemplate',
          'cloudformation:ListChangeSets',
          'cloudformation:UpdateStack'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteCloudFrontGrants',
        Effect : 'Allow',
        Action : [
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
          'cloudfront:UpdateOriginAccessControl'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteDynamoDBGrants',
        Effect : 'Allow',
        Action : [
          'dynamodb:CreateTable',
          'dynamodb:DeleteTable',
          'dynamodb:DescribeTable',
          'dynamodb:ListTagsOfResource',
          'dynamodb:TagResource',
          'dynamodb:UpdateTable'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsitePolicyManagement',
        Effect : 'Allow',
        Action : [
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:DeleteRolePolicy'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsitePassRole',
        Effect : 'Allow',
        Action : [
          'iam:PassRole'
        ],
        Resource : [
          `arn:aws:iam::${accountID}:role/cloudsite/*`
        ],
        Condition : {
          'ForAnyValue:StringEquals' : {
            'iam:PassedToService' : [
              'lambda.amazonaws.com',
              'edgelambda.amazonaws.com'
            ]
          }
        }
      },
      {
        Sid    : 'CloudsiteRoleManagement',
        Effect : 'Allow',
        Action : [
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:GetRole',
          'iam:PutRolePolicy',
          'iam:TagRole',
          'iam:UntagRole',
          'iam:UpdateRole'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteLambdaGrants',
        Effect : 'Allow',
        Action : [
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
          'lambda:PublishVersion',
          'lambda:RemovePermission',
          'lambda:TagResource',
          'lambda:UpdateEventSourceMapping',
          'lambda:UpdateFunctionConfiguration',
          'lambda:UpdateFunctionUrlConfig'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteLogGrants',
        Effect : 'Allow',
        Action : [
          'logs:CreateLogGroup',
          'logs:DeleteLogGroup',
          'logs:DeleteRetentionPolicy',
          'logs:PutRetentionPolicy',
          'logs:TagResource'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteRoute53Grants',
        Effect : 'Allow',
        Action : [
          'route53:ListHostedZones',
          'route53:ChangeResourceRecordSets',
          'route53:ChangeTagsForResource',
          'route53:ListResourceRecordSets'
        ],
        Resource : [
          '*'
        ]
      },
      {
        Sid    : 'CloudsiteS3Grants',
        Effect : 'Allow',
        Action : [
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
          's3:PutBucketTagging',
          's3:*'
        ],
        Resource : [
          'arn:aws:s3:::*'
        ]
      }
    ]
  }
}

const instructions =
`1. Log into the AWS console.
2. Select/navigate to the IAM service.
3. Select 'Policies' from the left hand menu options.
4. Select 'Create policy'.
5. Select the 'JSON' option.
6. Replace the JSON with the text below.`

const handleGetIAMPolicy = async ({ argv, globalOptions }) => {
  const getIAMPolicyOptionsSpec = cliSpec.commands.find(({ name }) => name === 'get-iam-policy').arguments
  const getIAMPolicyOptions = commandLineArgs(getIAMPolicyOptionsSpec, { argv })
  const withInstructions = getIAMPolicyOptions['with-instructions']

  if (withInstructions === true) {
    process.stdout.write(instructions + '\n\n')
  }
  process.stdout.write(JSON.stringify(await generateIAMPolicy(globalOptions), null, '  ') + '\n')
}

export { handleGetIAMPolicy }
