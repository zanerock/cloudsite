import { errorOut } from './error-out'

const getSiteInfo = ({ apexDomain, db }) => {
  if (apexDomain === undefined) {
    errorOut('Must specify site domain.\n')
  }

  const siteInfo = db.sites[apexDomain]
  if (siteInfo === undefined) {
    errorOut(`No such site '${apexDomain}' found.\n`)
  }

  return siteInfo
}

export { getSiteInfo }
