const name = 'cloudfront-logs'

const config = {
  options : {
    includeCookies : { default : false, validation : (v) => typeof v === 'boolean' }
  }
}

const importHandler = ({ credentials, siteInfo }) => {
  
}

const preStackDestroyHandler = async ({ siteTemplate }) => {
  await siteTemplate.destroyCommonLogsBucket()
}

const stackConfig = async ({ siteTemplate, settings }) => {
  const { finalTemplate } = siteTemplate

  await siteTemplate.enableCommonLogsBucket()

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Logging = {
    Bucket         : { 'Fn::GetAtt' : ['commonLogsBucket', 'DomainName'] },
    IncludeCookies : settings.includeCookies,
    Prefix         : 'cloudfront-logs/'
  }
}

const cloudfrontLogs = { config, importHandler, name, preStackDestroyHandler, stackConfig }

export { cloudfrontLogs }
