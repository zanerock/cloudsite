import { AccountClient, ListRegionsCommand } from '@aws-sdk/client-account'
import { ListInstancesCommand, SSOAdminClient } from '@aws-sdk/client-sso-admin'

import { progressLogger } from './progress-logger'

const findIdentityStore = async ({ credentials, firstCheckRegion, instanceRegion, scope }) => {
  const regionDescription = instanceRegion !== undefined
    ? instanceRegion + ' region '
    : scope !== undefined
      ? scope + ' regions '
      : ''
  progressLogger.write(`Checking ${regionDescription}for SSO identity store...`)

  let nextToken
  const accountClient = new AccountClient({ credentials })
  let ssoAdminClient

  do {
    const listRegionsCommand = new ListRegionsCommand({
      MaxResults              : 50, // max allowed as of 2024-04-15
      NextToken               : nextToken,
      RegionOptStatusContains : ['ENABLED', 'ENABLED_BY_DEFAULT']
    })
    const listRegionsResult = await accountClient.send(listRegionsCommand)

    let regions = listRegionsResult.Regions.map(({ RegionName }) => RegionName)
    const origRegions = [...regions]
    if (instanceRegion !== undefined || scope !== undefined) {
      const testFunc = instanceRegion !== undefined
        ? (regionName) => regionName === instanceRegion
        : scope.startsWith('!') === true
          ? (regionName) => !regionName.startsWith(scope.slice(1))
          : (regionName) => regionName.startsWith(scope)

      regions = regions.filter(testFunc)

      if (regions.length === 0) {
        throw new Error(`No such '${regionDescription}' found. Availablel regions are:\n- ` + origRegions.join('\n- '))
      }
    }

    regions.sort((a, b) => {
      const aName = a
      const bName = b

      const aUS = aName.startsWith('us-')
      const bUS = bName.startsWith('us-')

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

    for (const region of regions) {
      progressLogger.write('.')
      ssoAdminClient = new SSOAdminClient({ credentials, region })
      const listInstancesCommand = new ListInstancesCommand({})
      const listInstancesResult = await ssoAdminClient.send(listInstancesCommand)
      if (listInstancesResult.Instances.length > 0) {
        console.log('FOUND; ssoAdminClient', ssoAdminClient) // DEBUG
        progressLogger.write(' FOUND.\n')
        const instance = listInstancesResult.Instances[0]
        return {
          id          : instance.IdentityStoreId,
          instanceARN : instance.InstanceArn,
          name        : instance.Name,
          region,
          ssoAdminClient,
          ssoStartURL : 'https://' + instance.IdentityStoreId + '.awsapps.com/start'
        }
      }
    }
    nextToken = listRegionsResult.NextToken
  } while (nextToken !== undefined)

  console.log('HUH??') // DEBUG
  progressLogger.write(' NOT FOUND.\n')
  // return { region : firstCheckRegion, ssoAdminClient : new SSOAdminClient({ credentials, region : firstCheckRegion }) }
  return {}
}

// TOOD: in future we can examine the default region to determine the first scope.
const findIdentityStoreStaged = async ({ credentials, firstCheckRegion, scope = 'us' }) => {
  let findResult = await findIdentityStore({ credentials, firstCheckRegion, scope })
  if (findResult.id !== undefined) {
    console.log('WHAT?') // DEBUG
    return findResult
  }
  const oppositeScope = scope.startsWith('!')
    ? scope.slice(1)
    : '!' + scope

  findResult = await findIdentityStore({ credentials, firstCheckRegion, scope : oppositeScope })
  return findResult
}

export { findIdentityStore, findIdentityStoreStaged }
