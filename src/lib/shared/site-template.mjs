import yaml from 'js-yaml'

import { S3Client, DeleteBucketCommand } from '@aws-sdk/client-s3'

import { determineBucketName } from './determine-bucket-name'
import { determineOACName } from './determine-oac-name'
import * as plugins from '../plugins'
import { progressLogger } from './progress-logger'

/**
 * Class encapsulating site stack configuration. Any enabled plugins are loaded and processed by this class.
 * @class
 */
const SiteTemplate = class {
  /* eslint-disable jsdoc/check-param-names */ // eslint doesn't believe our 2nd level destructure documentation
  /**
   * Creates a new {@link SiteTemplate}.
   * @param {object} input - Destructured input argument.
   * @param {object} input.credentials - credentials for AWS SDK clients.
   * @param {object} input.siteInfo - Collection of site related data elements.
   * @param {string} input.siteInfo.apexDomain - the sites apex domain
   * @param {string} input.siteInfo.sourcePath - the path to the site's static source files, may be absolute or CWD
   *   relative
   * @param {string} input.siteInfo.region - the region of the site
   * @param {string} input.siteInfo.certificateArn {string} - the AWS ARN for the site's SSL certificate
   * @param {string} input.siteInfo.accountID - the ID of the account under which the stack resides (not ARN)
   * @param {string} input.siteInfo.bucketName - the name of the bucket where the site's static files are stored
   * @param {string} input.siteInfo.stackName - the name of the stack
   * @param {string} input.siteInfo.stackArn - the stack's ARN
   * @param {string} input.siteInfo.cloudFrontDistributionID - the stack's CloudfFront ID (not ARN)
   * @param {object} input.siteInfo.pluginSettings - collection of plugin settings; settings are grouped/keyed by the
   *   plugin's name; setting values are dependent on the plugin
   * @param credentials.siteInfo
   */ /* eslint-enable jsdoc/check-param-names */
  constructor ({ credentials, siteInfo }) {
    this.siteInfo = siteInfo
    this.credentials = credentials

    this.resourceTypes = { 'CloudFormation::Distribution' : true, 'S3::Bucket' : true }
    this.finalTemplate = this.baseTemplate
  }

  async initializeTemplate () {
    const { accountID, apexDomain, bucketName, certificateArn, region } = this.siteInfo

    const oacName = await determineOACName({
      baseName    : `${bucketName}-OAC`,
      credentials : this.credentials,
      siteInfo    : this.siteInfo
    })

    this.finalTemplate = {
      Resources : {
        SiteS3Bucket : {
          Type       : 'AWS::S3::Bucket',
          Properties : {
            AccessControl : 'Private',
            BucketName    : bucketName
          }
        },
        SiteCloudFrontOriginAccessControl : {
          Type       : 'AWS::CloudFront::OriginAccessControl',
          Properties : {
            OriginAccessControlConfig : {
              Description                   : 'Origin Access Control (OAC) allowing CloudFront Distribution to access site S3 bucket.',
              Name                          : oacName,
              OriginAccessControlOriginType : 's3',
              SigningBehavior               : 'always',
              SigningProtocol               : 'sigv4'
            }
          }
        },
        SiteCloudFrontDistribution : {
          Type       : 'AWS::CloudFront::Distribution',
          DependsOn  : ['SiteS3Bucket'],
          Properties : {
            DistributionConfig : {
              Origins : [
                {
                  DomainName     : `${bucketName}.s3.${region}.amazonaws.com`,
                  Id             : 'static-hosting',
                  S3OriginConfig : {
                    OriginAccessIdentity : ''
                  },
                  OriginAccessControlId : { 'Fn::GetAtt' : ['SiteCloudFrontOriginAccessControl', 'Id'] }
                }
              ],
              Enabled              : true,
              DefaultRootObject    : 'index.html',
              CustomErrorResponses : [
                { ErrorCode : 403, ResponseCode : 200, ResponsePagePath : '/index.html' },
                { ErrorCode : 404, ResponseCode : 200, ResponsePagePath : '/index.html' }
              ],
              HttpVersion       : 'http2',
              Aliases           : [apexDomain, `www.${apexDomain}`],
              ViewerCertificate : {
                AcmCertificateArn      : certificateArn,
                MinimumProtocolVersion : 'TLSv1.2_2021',
                SslSupportMethod       : 'sni-only'
              },
              DefaultCacheBehavior : {
                AllowedMethods       : ['GET', 'HEAD'],
                CachePolicyId        : '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized cache policy ID
                Compress             : true,
                TargetOriginId       : 'static-hosting',
                ViewerProtocolPolicy : 'redirect-to-https'
              }
            }
          }
        }, // SiteCloudFrontDistribution
        SiteBucketPolicy : {
          Type       : 'AWS::S3::BucketPolicy',
          DependsOn  : ['SiteS3Bucket', 'SiteCloudFrontDistribution'],
          Properties : {
            Bucket         : bucketName,
            PolicyDocument : {
              Version   : '2012-10-17',
              Statement : [
                {
                  Effect    : 'Allow',
                  Principal : {
                    Service : 'cloudfront.amazonaws.com'
                  },
                  Action    : 's3:GetObject',
                  Resource  : `arn:aws:s3:::${bucketName}/*`,
                  Condition : {
                    StringEquals : {
                      'AWS:SourceArn' : {
                        'Fn::Join' : ['', [`arn:aws:cloudfront::${accountID}:distribution/`, { 'Fn::GetAtt' : ['SiteCloudFrontDistribution', 'Id'] }]]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }, // Resources
      Outputs : {
        SiteS3Bucket : {
          Value : { Ref : 'SiteS3Bucket' }
        },
        SiteCloudFrontOriginAccessControl : {
          Value : { Ref : 'SiteCloudFrontOriginAccessControl' }
        },
        SiteCloudFrontDistribution : {
          Value : { Ref : 'SiteCloudFrontDistribution' }
        },
        OriginAccessControl : {
          Value : { Ref : 'SiteCloudFrontOriginAccessControl' }
        }
      }
    }
  }

  async destroyCommonLogsBucket () {
    const { siteInfo } = this
    const { commonLogsBucket } = siteInfo

    progressLogger.write('Deleting shared logging bucket...\n')
    const s3Client = new S3Client({ credentials : this.credentials })
    const deleteBucketCommand = new DeleteBucketCommand({ Bucket : commonLogsBucket })
    await s3Client.send(deleteBucketCommand)
    delete siteInfo.commonLogsBucket
  }

  async enableCommonLogsBucket () {
    const { bucketName } = this.siteInfo // used to create a name for the shared logging bucket
    let { commonLogsBucket = bucketName + '-common-logs' } = this.siteInfo

    if (commonLogsBucket === undefined) {
      commonLogsBucket = await determineBucketName({
        bucketName  : commonLogsBucket,
        credentials : this.credentials,
        findName    : true,
        siteInfo    : this.siteInfo
      })
    }
    this.siteInfo.commonLogsBucket = commonLogsBucket

    this.finalTemplate.Resources.commonLogsBucket = {
      Type       : 'AWS::S3::Bucket',
      Properties : {
        AccessControl     : 'Private',
        BucketName        : commonLogsBucket,
        OwnershipControls : { // this enables ACLs, as required by CloudFront standard logging
          Rules : [{ ObjectOwnership : 'BucketOwnerPreferred' }]
        }
      }
    }

    return commonLogsBucket
  }

  async destroyPlugins () {
    const { siteInfo } = this
    const { apexDomain, pluginSettings } = siteInfo

    for (const [pluginKey, settings] of Object.entries(pluginSettings)) {
      const plugin = plugins[pluginKey]
      if (plugin === undefined) {
        throw new Error(`Unknown plugin found in '${apexDomain}' plugin settings.`)
      }

      const { preStackDestroyHandler } = plugin
      if (preStackDestroyHandler !== undefined) {
        await preStackDestroyHandler({ siteTemplate : this, settings })
      }
    }
  }

  async loadPlugins () {
    const { siteInfo } = this
    const { apexDomain, pluginSettings } = siteInfo

    for (const [pluginKey, settings] of Object.entries(pluginSettings)) {
      const plugin = plugins[pluginKey]
      if (plugin === undefined) {
        throw new Error(`Unknown plugin found in '${apexDomain}' plugin settings.`)
      }

      await plugin.stackConfig({ siteTemplate : this, settings })
    }
  }

  render () {
    const { apexDomain } = this.siteInfo
    const resourceTypes = Object.keys(this.resourceTypes).sort()

    const outputTemplate = Object.assign({
      AWSTemplateFormatVersion : '2010-09-09',
      Description              : `${apexDomain} site built with ${resourceTypes.slice(0, -1).join(', ')} and ${resourceTypes[resourceTypes.length - 1]}.`
    },
    this.finalTemplate
    )

    const output = yaml.dump(outputTemplate, { lineWidth : 0 })
    return output
  }
}

export { SiteTemplate }
