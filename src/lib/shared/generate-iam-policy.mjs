import { getAccountID } from './get-account-id'
import { getCredentials } from './authentication-lib'
import { SSO_POLICY_CONTENT_MANAGER } from './constants'

const generateIAMPolicy = async ({ db, globalOptions, policyName }) => {
  let { accountID } = db.account
  if (accountID === undefined) {
    const credentials = getCredentials(globalOptions)
    accountID = await getAccountID({ credentials })
  }

  if (policyName === SSO_POLICY_CONTENT_MANAGER) {
    return contentManagerPolicy(accountID)
  } else {
    throw new Error(`Cannot generate unknown policy: ${policyName}`)
  }
}

const contentManagerPolicy = (accountID) => ({
  Version   : '2012-10-17',
  Statement : [
    {
      Sid    : 'AccontGrants',
      Effect : 'Allow',
      Action : [
        'account:ListRegions'
      ],
      Resource : [
        `arn:aws:account::${accountID}:account`
      ]
    },
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
        'ce:UpdateCostAllocationTagsStatus',
        'ce:CreateCostCategoryDefinition'
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
        'cloudformation:DetectStackResourceDrift',
        'cloudformation:GetTemplate',
        'cloudformation:ListChangeSets',
        'cloudformation:ListStacks',
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
        'dynamodb:UntagResource',
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
        'iam:DeleteRolePolicy',
        'iam:ListPolicies'
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
      Sid    : 'CloudsiteIdentityStoreGrants',
      Effect : 'Allow',
      Action : [
        'identitystore:ListGroups'
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
        'lambda:ListTags',
        'lambda:ListVersionsByFunction',
        'lambda:PublishVersion',
        'lambda:RemovePermission',
        'lambda:TagResource',
        'lambda:UpdateEventSourceMapping',
        'lambda:UpdateFunctionCode',
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
        'logs:ListTagsForResource',
        'logs:PutRetentionPolicy',
        'logs:TagResource',
        'logs:UntagResource'
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
    },
    {
      Sid    : 'SingleSignOnGrants',
      Effect : 'Allow',
      Action : [
        'sso:DescribePermissionSet',
        'sso:ListInstances',
        'sso:ListPermissionSets'
      ],
      Resource : [
        '*'
      ]
    }
  ]
})

export { generateIAMPolicy }
