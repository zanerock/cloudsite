import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { AUTHENTICATION_PROFILE_ADMIN, POLICY_SITE_MANAGER_POLICY } from '../../lib/shared/constants'
import { cliSpec } from '../constants'
import { ensureAdminAuthentication } from '../../lib/shared/authentication-lib'
import { getAccountID } from '../../lib/shared/get-account-id'
import { getOptionsSpec } from '../lib/get-options-spec'
import { handler as createUser } from './users/create'
import { ensureRootOrganization } from './_lib/ensure-root-organization'
import { findIdentityStoreStaged } from '../../lib/shared/find-identity-store'
import { progressLogger } from '../../lib/shared/progress-logger'
import { setupGlobalPermissions } from '../../lib/actions/setup-global-permissions'
import { setupSSO } from '../../lib/actions/setup-sso'

const handler = async ({ argv, db, globalOptions }) => {
  const ssoSetupOptionsSpec = getOptionsSpec({ cliSpec, name : 'setup' })
  const ssoSetupOptions = commandLineArgs(ssoSetupOptionsSpec, { argv })
  let {
    'identity-store-name': identityStoreName,
    'identity-store-region': identityStoreRegion = 'us-east-1',
    'no-key-delete': noKeyDelete
    // we don't need the 'user' parameters; they'll be extracted by createUser
  } = ssoSetupOptions
  let credentials

  const authProfile = (globalOptions.ssoCLIOverride && globalOptions['sso-profile']) || AUTHENTICATION_PROFILE_ADMIN;

  ({ credentials, noKeyDelete } = await ensureAdminAuthentication({ authProfile, noKeyDelete }))

  const accountID = await getAccountID({ credentials })

  let identityStoreARN, identityStoreID, ssoSuccess, ssoUserMessage
  ({
    success : ssoSuccess,
    userMessage : ssoUserMessage,
    identityStoreARN,
    identityStoreRegion,
    identityStoreID
  } =
    await createSSO({
      credentials,
      db,
      identityStoreName,
      identityStoreRegion,
      ssoSetupOptions
    }))

  if (ssoSuccess !== true) {
    return { success : ssoSuccess, userMessage : ssoUserMessage }
  }
  await setupGlobalPermissions({
    accountID,
    credentials,
    db,
    globalOptions,
    identityStoreARN,
    identityStoreID,
    identityStoreRegion
  })

  const createUserArgv = (argv || [])
  // the initial user is always an admin user
  createUserArgv.push('--policy-name', POLICY_SITE_MANAGER_POLICY)
  createUserArgv.push('--no-error-on-existing')
  // noKeyDelete may have been set by ensureAdminAuthentication
  if (noKeyDelete === true && !argv.includes('--no-key-delete')) {
    createUserArgv.push('--no-key-delete')
  }
  const { success : userSuccess, userMessage : userUserMessage } =
    await createUser({ argv : createUserArgv, db, globalOptions })
  // createUser will handle removing the auth key

  return { succes : userSuccess, message : ssoUserMessage + '\n' + userUserMessage }
}

const createSSO = async ({
  credentials,
  db,
  globalOptions,
  identityStoreName,
  identityStoreRegion,
  ssoSetupOptions
}) => {
  let identityStoreARN, identityStoreID, ssoStartURL
  ({ identityStoreARN, identityStoreID, identityStoreName, identityStoreRegion, ssoStartURL } =
    await findIdentityStoreStaged({ credentials, firstCheckRegion : identityStoreRegion }))

  if (identityStoreID !== undefined) {
    db.permissions.sso.identityStoreARN = identityStoreARN
    db.permissions.sso.identityStoreID = identityStoreID
    db.permissions.sso.identityStoreName = identityStoreName
    db.permissions.sso.identityStoreRegion = identityStoreRegion
    db.permissions.sso.ssoStartURL = ssoStartURL
  } else { // (identityStoreID === undefined)
    await ensureRootOrganization({ credentials, db, globalOptions })

    const interrogationBundle = {
      actions : [
        {
          statement : "You do not appear to have an Identity Center associated with your account. The Identity Center is where you'll sign in to allow Cloudsite to work with AWS."
        }
      ]
    }

    if (identityStoreName === undefined) {
      interrogationBundle.actions.push({
        prompt    : "Enter the preferred <em>name for the Identity Center<rst> instance (typically based on your primary domain name with '-' instead of '.'; e.g.: foo-com):",
        parameter : 'identity-store-name'
      })
    }

    if (identityStoreID === undefined) {
      interrogationBundle.actions.push({
        prompt    : 'Enter the preferred <em>AWS region<rst> for the identity store instance:',
        default   : identityStoreRegion,
        parameter : 'identity-store-region'
      })
    }

    const questioner = new Questioner({
      initialParameters : ssoSetupOptions,
      interrogationBundle,
      output            : progressLogger
    })
    await questioner.question()

    if (identityStoreName === undefined) {
      identityStoreName = questioner.get('identity-store-name')
    }
    if (identityStoreID === undefined) {
      identityStoreRegion = questioner.get('identity-store-region')
    }

    ({ identityStoreARN, identityStoreID, identityStoreName, identityStoreRegion, ssoStartURL } = await setupSSO({
      credentials,
      db,
      identityStoreARN,
      identityStoreID,
      identityStoreName,
      identityStoreRegion,
      ssoStartURL
    }))
  }

  return {
    success     : true,
    userMessage : 'Settings updated.',
    identityStoreARN,
    identityStoreRegion,
    identityStoreID,
    ssoStartURL
  }
}

export { handler }
