const getAccountRegions = ({ credentials, scope, sortPreference }) => {
  let nextToken
  const regions = []
  const allRegions = []

  const accountClient = new AccountClient({ credentials })

  do {
    const listRegionsCommand = new ListRegionsCommand({
      MaxResults              : 50, // max allowed as of 2024-04-15
      NextToken               : nextToken,
      RegionOptStatusContains : ['ENABLED', 'ENABLED_BY_DEFAULT']
    })
    const listRegionsResult = await accountClient.send(listRegionsCommand)

    regions.push(...listRegionsResult.Regions.map(({ RegionName }) => RegionName))
    allRegions.push(...regions)
    if (scope !== undefined) {
      const testFunc = scope.startsWith('!') === true
        ? (regionName) => !regionName.startsWith(scope.slice(1))
        : (regionName) => regionName.startsWith(scope)

      regions = regions.filter(testFunc) // this will re-process the same prior regions if paging
    }
    nextToken = listRegionsResult.NextToken
  } while (nextToken !== undefined)

  if (sortPreference !== undefined) {
    regions.sort((a, b) => {
      const aName = a
      const bName = b

      const aUS = aName.startsWith(sortPreference)
      const bUS = bName.startsWith(sortPreference)

      if (aName === firstCheckRegion) {
        return -1
      } else if (bName === firstCheckRegion) {
        return 1
      } else if (aUS === true && bUS === false) {
        return -1
      } else if (aUS === false && bUS === true) {
        return 1
      } else {
        return aName.localeCompare(bName)
      }
    })
  }

  return { allRegions, regions }
}

export { getAccountRegions }