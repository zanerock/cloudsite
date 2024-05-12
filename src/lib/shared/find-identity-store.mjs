import { AccountClient, ListRegionsCommand } from '@aws-sdk/client-account'
import { ListInstancesCommand, SSOAdminClient } from '@aws-sdk/client-sso-admin'

import { progressLogger } from './progress-logger'

const findIdentityStore = async ({ credentials, instanceRegion }) => {
  progressLogger.write('Checking for SSO identity store...')

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

    const regions = listRegionsResult.Regions.sort((a, b) => {
      const aName = a.RegionName
      const bName = b.RegionName

      const aUS = aName.startsWith('us-')
      const bUS = bName.startsWith('us-')

      if (aName === instanceRegion) {
        return -1
      } else if (bName === instanceRegion) {
        return 1
      } else if (aUS === true && bUS === false) {
        return -1
      } else if (aUS === false && bUS === true) {
        return 1
      } else {
        return aName.localeCompare(bName)
      }
    })

    for (const { RegionName: region } of regions) {
      ssoAdminClient = new SSOAdminClient({ credentials, region })
      const listInstancesCommand = new ListInstancesCommand({})
      const listInstancesResult = await ssoAdminClient.send(listInstancesCommand)
      if (listInstancesResult.Instances.length > 0) {
        progressLogger.write(' FOUND.\n')
        const instance = listInstancesResult.Instances[0]
        return {
          id          : instance.IdentityStoreId,
          instanceARN : instance.InstanceArn,
          name        : instance.Name,
          region,
          ssoAdminClient,
          ssoStartURL : 'https://' + instance.Name + '.awsapps.com/start'
        }
      }
    }
    nextToken = listRegionsResult.NextToken
  } while (nextToken !== undefined)

  progressLogger.write(' NOT FOUND.\n')
  return { region : instanceRegion, ssoAdminClient : new SSOAdminClient({ credentials, region : instanceRegion }) }
}

export { findIdentityStore }
