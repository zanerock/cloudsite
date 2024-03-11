const config = {
  options : {
    includeCookies : { default : false, validation : (v) => typeof v === 'boolean' }
  }
}

const stackConfig = async ({ siteTemplate, settings }) => {
  const { finalTemplate } = siteTemplate

  await finalTemplate.enableSharedLoggingBucket()

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Logging = {
    Bucket         : { 'Fn::GetAtt' : ['SharedLoggingBucket', 'DomainName'] },
    IncludeCookies : settings.includeCookies,
    Prefix         : 'cloudfront-logs/'
  }
}

const cloudfrontLogs = { config, stackConfig }

export { cloudfrontLogs }
