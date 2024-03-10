const config = {
  options : {
    includeCookies : { default : false, validation : (v) => typeof v === 'boolean' }
  }
}

const stackConfig = async ({ siteTemplate, settings }) => {
  const { finalTemplate } = siteTemplate

  const sharedLogingBucketName = siteTemplate.enableSharedLoggingBucket()

  finalTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('SharedLoggingBucket')

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Logging = {
    Bucket         : { 'Fn::GetAtt' : ['SharedLoggingBucket', 'DomainName'] },
    IncludeCookies : settings.includeCookies,
    Prefix         : 'cloudfront-logs/'
  }
}

const cloudfrontLogs = { config, stackConfig }

export { cloudfrontLogs }
