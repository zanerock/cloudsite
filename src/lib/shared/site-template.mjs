import yaml from 'js-yaml'

import { emptyBucket } from 's3-empty-bucket'

import { S3Client } from '@aws-sdk/client-s3'

import { determineBucketName } from './determine-bucket-name'
import { determineOACName } from './determine-oac-name'
import { getSiteTag } from './get-site-tag'
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
   * @param {string} input.siteInfo.siteBucketName - the name of the bucket where the site's static files are stored
   * @param {string} input.siteInfo.stackName - the name of the stack
   * @param {string} input.siteInfo.stackArn - the stack's ARN
   * @param {string} input.siteInfo.cloudFrontDistributionID - the stack's CloudfFront ID (not ARN)
   * @param {object} input.siteInfo.plugins - collection of plugin settings; settings are grouped/keyed by the
   *   plugin's name; setting values are dependent on the plugin
   * @param credentials.siteInfo
   */ /* eslint-enable jsdoc/check-param-names */
  constructor ({ credentials, siteInfo }) {
    this.siteInfo = siteInfo
    this.credentials = credentials

    this.resourceTypes = { 'CloudFormation::Distribution' : true, 'S3::Bucket' : true }
    this.finalTemplate = this.baseTemplate
  }

  async initializeTemplate ({ update } = {}) {
    const { siteInfo } = this
    const { accountID, apexDomain, siteBucketName, certificateArn, region } = siteInfo
    const siteTag = getSiteTag(siteInfo)

    const oacName = update === true
      ? siteInfo.oacName
      : await determineOACName({
        baseName    : `${apexDomain}-OAC`,
        credentials : this.credentials,
        siteInfo    : this.siteInfo
      })
    progressLogger?.write(`Using OAC name: ${oacName}\n`)
    this.siteInfo.oacName = oacName

    this.finalTemplate = {
      Resources : {
        SiteS3Bucket : {
          Type       : 'AWS::S3::Bucket',
          Properties : {
            AccessControl : 'Private',
            BucketName    : siteBucketName,
            Tags          : [{ Key : siteTag, Value : '' }, { Key : 'function', Value : 'website contents storage' }]
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
                  DomainName     : `${siteBucketName}.s3.${region}.amazonaws.com`,
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
            }, // DistributionConfig
            Tags : [{ Key : siteTag, Value : '' }]
          } // Properties
        }, // SiteCloudFrontDistribution
        SiteBucketPolicy : {
          Type       : 'AWS::S3::BucketPolicy',
          DependsOn  : ['SiteS3Bucket', 'SiteCloudFrontDistribution'],
          Properties : {
            Bucket         : siteBucketName,
            PolicyDocument : {
              Version   : '2012-10-17',
              Statement : [
                {
                  Effect    : 'Allow',
                  Principal : {
                    Service : 'cloudfront.amazonaws.com'
                  },
                  Action    : 's3:GetObject',
                  Resource  : `arn:aws:s3:::${siteBucketName}/*`,
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

    if (commonLogsBucket !== undefined) {
      progressLogger.write('Deleting common logs bucket...\n')
      const s3Client = new S3Client({ credentials : this.credentials })
      await emptyBucket({
        bucketName : commonLogsBucket,
        doDelete   : true,
        s3Client,
        verbose    : progressLogger !== undefined
      })
      delete siteInfo.commonLogsBucket
    } else {
      progressLogger?.write('Looks like the shared logging bucket has already been deleted; skipping.\n')
    }
  }

  async enableCommonLogsBucket () {
    let { commonLogsBucket } = this.siteInfo
    const siteTag = getSiteTag(this.siteInfo)

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
        },
        Tags : [{ Key : siteTag, Value : '' }, { Key : 'function', Value : 'common logs storage' }]
      }
    }

    return commonLogsBucket
  }

  async destroyPlugins () {
    const { siteInfo } = this
    const { apexDomain } = siteInfo
    const pluginsData = siteInfo.plugins || {}

    for (const [pluginKey, pluginData] of Object.entries(pluginsData)) {
      const plugin = plugins[pluginKey]
      if (plugin === undefined) {
        throw new Error(`Unknown plugin found in '${apexDomain}' plugin settings.`)
      }

      const { preStackDestroyHandler } = plugin
      if (preStackDestroyHandler !== undefined) {
        await preStackDestroyHandler({ siteTemplate : this, pluginData })
      }
    }
  }

  async loadPlugins ({ update } = {}) {
    const { siteInfo } = this
    const { apexDomain } = siteInfo
    const pluginsData = siteInfo.plugins || {}

    const pluginConfigs = []
    for (const [pluginKey, pluginData] of Object.entries(pluginsData)) {
      const plugin = plugins[pluginKey]
      if (plugin === undefined) {
        throw new Error(`Unknown plugin found in '${apexDomain}' plugin settings.`)
      }

      pluginConfigs.push(plugin.stackConfig({ siteTemplate : this, pluginData, update }))
    }

    await Promise.all(pluginConfigs)
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

    // turn off multi-line blocks and (must) turn off refs to prevent aliasing of repeated tags objects
    const output = yaml.dump(outputTemplate, { lineWidth : 0, noRefs : true })
    return output
  }
}

export { SiteTemplate }
