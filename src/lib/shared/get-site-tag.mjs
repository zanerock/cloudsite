const getSiteTag = (siteInfo) => {
  console.log('tag:', 'site:' + siteInfo.apexDomain) // DEBUG
  return 'site:' + siteInfo.apexDomain
}

export { getSiteTag }
