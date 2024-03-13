const verify = async ({ checkContent, checkSiteUp, checkStack, siteInfo, ...globalOptions }) => {
  const checkAll = checkContent === undefined && checkSiteUp === undefined && checkStack === undefined

  const checks = []
  if (checkAll || checkSiteUp) {
    checks.push(doCheckSiteUp({ siteInfo, ...globalOptions }))
  }

  const results = await Promise.all(checks)

  return results
}

const doCheckSiteUp = async ({ siteInfo }) => {
  const { apexDomain } = siteInfo

  try {
    const fetchResponses = await Promise.all([
      fetch('https://' + apexDomain),
      fetch('https://www.' + apexDomain)
    ])

    const results = [
      processFetchResults({ domain : apexDomain, fetchResponse : fetchResponses[0] }),
      processFetchResults({ domain : 'www.' + apexDomain, fetchResponse : fetchResponses[1] })
    ]

    return results
  } catch (e) {
    return [
      { check : `site ${apexDomain} is up`, status : 'error', message : e.message },
      { check : `site www.${apexDomain} is up`, status : 'error', message : e.message }
    ]
  }
}

const processFetchResults = ({ domain, fetchResponse }) => {
  const result = {
    check   : `site ${domain} is up`,
    message : `Got HTTP status ${fetchResponse.status} fetching https://${domain}.`
  }

  if (fetchResponse.status === 200) {
    result.status = 'success'
  } else {
    result.status = 'failed'
  }

  return result
}

export { verify }
