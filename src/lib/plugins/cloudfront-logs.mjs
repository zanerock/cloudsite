const config = {
  name        : 'CloudFront logs',
  description : 'Enables logging of CloudFront events.',
  options     : {
    includeCookies : {
      description : 'Whether to log cookies or not.',
      default     : false,
      paramType   : 'boolean'
    }
  }
}

const importHandler = ({ /* credentials, */ name, pluginsData, /* siteInfo, */ template }) => {
  const cloudFrontLoggingConfig = template.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Logging
  if (cloudFrontLoggingConfig !== undefined) {
    const settings = {
      includeCookies : cloudFrontLoggingConfig.IncludeCookies
    }
    pluginsData[name] = settings
  }
}

const preStackDestroyHandler = async ({ siteTemplate }) => {
  await siteTemplate.destroyCommonLogsBucket()
}

const stackConfig = async ({ siteTemplate, pluginData }) => {
  const { finalTemplate } = siteTemplate

  await siteTemplate.enableCommonLogsBucket()

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Logging = {
    Bucket         : { 'Fn::GetAtt' : ['commonLogsBucket', 'DomainName'] },
    IncludeCookies : pluginData.settings.includeCookies,
    Prefix         : 'cloudfront-logs/'
  }
}

const cloudFrontLogs = { config, importHandler, preStackDestroyHandler, stackConfig }

export { cloudFrontLogs }
