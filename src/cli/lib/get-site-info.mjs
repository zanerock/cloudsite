import { errorOut } from './error-out'

const getSiteInfo = ({ apexDomain, sitesInfo }) => {
  if (apexDomain === undefined) {
    errorOut('Must specify site domain.\n')
  }

  const siteInfo = sitesInfo[apexDomain]
  if (siteInfo === undefined) {
    errorOut(`No such site '${apexDomain}' found.\n`)
  }

  return siteInfo
}

export { getSiteInfo }
