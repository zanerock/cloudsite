import { S3Client } from '@aws-sdk/client-s3'

const config = {
  options : {
    includeCookies : { default : false, validation : (v) => typeof v === 'boolean' }
  }
}

const preDestroyHandler = async ({ credentials, progressLogger, settings, siteInfo }) => {
  const { sharedLoggingBucket } = siteInfo

  const s3Client = new S3Client({ credentials })

  progressLogger?.write(`Deleting S3 bucket ${sharedLoggingBucket}... `)
  await emptyBucket({ bucketName : sharedLoggingBucket, s3Client })
  progressLogger?.write('DELETED\n')
}

const stackConfig = async ({ siteTemplate, settings }) => {
  const { finalTemplate } = siteTemplate

  await siteTemplate.enableSharedLoggingBucket()

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Logging = {
    Bucket         : { 'Fn::GetAtt' : ['SharedLoggingBucket', 'DomainName'] },
    IncludeCookies : settings.includeCookies,
    Prefix         : 'cloudfront-logs/'
  }
}

const cloudfrontLogs = { config, preDestroyHandler, stackConfig }

export { cloudfrontLogs }
