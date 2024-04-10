const updateCloudFrontDistribution = ({ siteTemplate }) => {
  const { finalTemplate } = siteTemplate

  const lambdaFunctionAssociations =
    finalTemplate
      .Resources
      .SiteCloudFrontDistribution
      .Properties.DistributionConfig
      .DefaultCacheBehavior
      .LambdaFunctionAssociations || []

  lambdaFunctionAssociations.push({
    EventType         : 'origin-request',
    IncludeBody       : false,
    LambdaFunctionARN : {
      'Fn::Join' : [':', [
        { 'Fn::GetAtt' : ['IndexRewriterFunction', 'Arn'] },
        { 'Fn::GetAtt' : ['IndexRewriterFunctionVersion', 'Version'] }]
      ]
    }
  })

  finalTemplate
    .Resources
    .SiteCloudFrontDistribution
    .Properties.DistributionConfig
    .DefaultCacheBehavior
    .LambdaFunctionAssociations = lambdaFunctionAssociations

  finalTemplate.Resources.SiteCloudFrontDistribution.DependsOn.push('IndexRewriterFunctionVersion')
}

export { updateCloudFrontDistribution }
