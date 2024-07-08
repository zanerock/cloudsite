import { AccountClient, ListRegionsCommand } from '@aws-sdk/client-account'
import { ListInstancesCommand, SSOAdminClient } from '@aws-sdk/client-sso-admin'

import { getAccountRegions } from './get-account-regions'
import { progressLogger } from './progress-logger'

const findIdentityStore = async ({ credentials, firstCheckRegion, identityStoreRegion, scope }) => {
  const regionDescription = identityStoreRegion !== undefined
    ? identityStoreRegion + ' region'
    : scope !== undefined
      ? scope + ' regions'
      : 'all regions'

  progressLogger.write(`Searching for SSO identity store in ${regionDescription}...`)

  let instanceData
  if (identityStoreRegion !== undefined) {
    instanceData = getInstanceData({ credentials, region : identityStoreRegion })
  } else {
    // TODO: get sort preference from settings
    const { allRegions, regions } = getAccountRegions({ credentials, scope, sortPreference : 'us-' })

    if (regions.length === 0) {
      throw new Error(`No such '${regionDescription}' found. Available regions are:\n- ` + allRegions.join('\n- '))
    }

    for (const region of regions) {
      progressLogger.write('.')
      
      instanceData = getInstanceData({ credentials, region })
      if (instanceData !== undefined) {
        break
      }
    }
  }

  if (instanceData !== undefined) {
    progressLogger.write(' FOUND.\n')
    return instanceData
  }
  else {
    progressLogger.write(' NOT FOUND.\n')
    return {}
  }
}

const getInstanceData = ({ credentials, region }) => {
  const ssoAdminClient = new SSOAdminClient({ credentials, region })
  const listInstancesCommand = new ListInstancesCommand({})
  const listInstancesResult = await ssoAdminClient.send(listInstancesCommand)
  if (listInstancesResult.Instances.length > 0) {
    const instance = listInstancesResult.Instances[0]
    return {
      identityStoreID     : instance.IdentityStoreId,
      identityStoreARN    : instance.InstanceArn,
      identityStoreName   : instance.Name,
      identityStoreRegion : region,
      ssoAdminClient,
      ssoStartURL         : 'https://' + instance.IdentityStoreId + '.awsapps.com/start'
    }
  }
}

// TOOD: in future we can examine the default region to determine the first scope.
const findIdentityStoreStaged = async ({ credentials, firstCheckRegion, scope = 'us' }) => {
  let findResult = await findIdentityStore({ credentials, firstCheckRegion, scope })
  if (findResult.identityStoreID !== undefined) {
    return findResult
  }
  const oppositeScope = scope.startsWith('!')
    ? scope.slice(1)
    : '!' + scope

  findResult = await findIdentityStore({ credentials, firstCheckRegion, scope : oppositeScope })
  return findResult
}

export { findIdentityStore, findIdentityStoreStaged }
