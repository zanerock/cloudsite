const getSiteInfo = ({ apexDomain, db }) => {
  if (apexDomain === undefined) {
    throw new Error('Must specify site domain.')
  }

  const siteInfo = db.sites[apexDomain]
  if (siteInfo === undefined) {
    throw new Error(`No such site '${apexDomain}' found.`)
  }

  return siteInfo
}

export { getSiteInfo }
