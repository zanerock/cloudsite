const config = {
  options : {
    includeCookies : { default : false, validation : (v) => typeof v === 'boolean' }
  }
}

const preStackDestroyHandler = async ({ siteTemplate }) => {
  await siteTemplate.destroySharedLoggingBucket()
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

const cloudfrontLogs = { config, preStackDestroyHandler, stackConfig }

export { cloudfrontLogs }
