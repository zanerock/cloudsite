const getResourceTags = ({ funcDesc, siteInfo }) => {
  const tags = [
    { Key : 'application', Value : 'Cloudsite' },
    { Key : 'site', Value : siteInfo.apexDomain }
  ]
  if (funcDesc !== undefined) {
    tags.push({ Key : 'function', Value : funcDesc })
  }
  return tags
}

export { getResourceTags }
