const getResourceTags = ({ funcDesc, siteInfo }) => [
  { Key: 'function', Value: funcDesc },
  { Key: 'site', Value: siteInfo.apexDomain },
  { Key: 'site:' + siteInfo.apexDomain, Value: '' }
]

export { getResourceTags }
