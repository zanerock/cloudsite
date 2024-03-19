const updateCloudFrontDistribution = ({ settings, siteTemplate }) => {
  const { finalTemplate } = siteTemplate
  const contactHandlerPath = settings.path

  finalTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('ContactHandlerLambdaURL')

  const cfOrigins = finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.Origins
  cfOrigins.push({
    Id         : 'ContactHandlerLambdaOrigin',
    DomainName : { // strip the https://
      'Fn::Select' : [2, { 'Fn::Split' : ['/', { 'Fn::GetAtt' : ['ContactHandlerLambdaURL', 'FunctionUrl'] }] }]
    },
    CustomOriginConfig : {
      HTTPSPort            : 443,
      OriginProtocolPolicy : 'https-only'
    }
  })

  const cfCacheBehaviors =
    finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors || []
  cfCacheBehaviors.push({
    AllowedMethods             : ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    CachePolicyId              : '4135ea2d-6df8-44a3-9df3-4b5a84be39ad', // caching disabled managed policy
    PathPattern                : contactHandlerPath,
    TargetOriginId             : 'ContactHandlerLambdaOrigin',
    ViewerProtocolPolicy       : 'https-only',
    LambdaFunctionAssociations : [
      {
        EventType         : 'origin-request',
        IncludeBody       : true,
        LambdaFunctionARN : {
          'Fn::Join' : [':', [
            { 'Fn::GetAtt' : ['SignRequestFunction', 'Arn'] },
            { 'Fn::GetAtt' : ['SignRequestFunctionVersion', 'Version'] }]
          ]
        }
      }
    ]
  })

  finalTemplate.Resources.SiteCloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors = cfCacheBehaviors
  finalTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('SignRequestFunctionVersion')
}

export { updateCloudFrontDistribution }
