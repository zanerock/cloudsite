import { POLICY_CONTENT_MANAGER_GROUP, POLICY_SITE_MANAGER_GROUP } from '../shared/constants'
import { setupPermissionsGroup } from './lib/setup-permissions-group'

const setupGlobalPermissions = async ({ credentials, db, globalOptions }) => {
  const standardGroup = [POLICY_CONTENT_MANAGER_GROUP, POLICY_SITE_MANAGER_GROUP]

  for (const groupName of standardGroup) {
    // TODO: process in parallel
    await setupPermissionsGroup({ credentials, db, globalOptions, groupName })
  }
}

export { setupGlobalPermissions }
