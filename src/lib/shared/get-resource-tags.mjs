const getResourceTags = ({ funcDesc, siteInfo }) => [
  { Key : 'application', value : 'Cloudsite' },
  { Key : 'site', Value : siteInfo.apexDomain },
  { Key : 'function', Value : funcDesc }
]

export { getResourceTags }
