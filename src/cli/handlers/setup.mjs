import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { AUTHENTICATION_PROFILE_ADMIN, POLICY_SITE_MANAGER_GROUP } from '../../lib/shared/constants'
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
    'no-key-delete': noKeyDelete,
    'user-email': userEmail,
    'user-family-name': userFamilyName,
    'user-given-name': userGivenName,
    'user-name': userName
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
    identityStoreID,
    identityStoreRegion
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

  const createUserArgv = []
  if (userEmail !== undefined) {
    createUserArgv.push('--user-email', userEmail)
  }
  if (userFamilyName !== undefined) {
    createUserArgv.push('--user-family-name', userName)
  }
  if (userGivenName !== undefined) {
    createUserArgv.push('--user-given-name', userName)
  }
  if (userName !== undefined) {
    createUserArgv.push('--user-name', userName)
  }
  // the initial user is always an admin user
  createUserArgv.push('--group-name', POLICY_SITE_MANAGER_GROUP)
  createUserArgv.push('--no-error-on-existing')
  // noKeyDelete may have been set by ensureAdminAuthentication
  if (noKeyDelete === true && !argv.includes('--no-key-delete')) {
    createUserArgv.push('--no-key-delete')
  }
  const { success : userSuccess, userMessage : userUserMessage } =
    await createUser({ argv : createUserArgv, db, globalOptions })
  // createUser will handle removing the auth key

  return { succes : userSuccess, userMessage : ssoUserMessage + '\n' + userUserMessage }
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
    db.sso.details.identityStoreARN = identityStoreARN
    db.sso.details.identityStoreID = identityStoreID
    db.sso.details.identityStoreName = identityStoreName
    db.sso.details.identityStoreRegion = identityStoreRegion
    db.sso.details.ssoStartURL = ssoStartURL
  } else { // (identityStoreID === undefined)
    await ensureRootOrganization({ credentials, db, globalOptions })

    const interrogationBundle = {
      actions : [
        {
          statement : "You do not appear to have an Identity Center associated with your account. The Identity Center is where you'll sign in to allow Cloudsite to work with AWS."
        }
      ]
    }

    interrogationBundle.actions.push({
      prompt    : "Enter the preferred <em>name for the Identity Center<rst> instance (typically based on your primary domain name with '-' instead of '.'; e.g.: foo-com):",
      parameter : 'identity-store-name'
    })

    interrogationBundle.actions.push({
      prompt    : 'Enter the preferred <em>AWS region<rst> for the identity store instance:',
      default   : identityStoreRegion,
      parameter : 'identity-store-region'
    })

    const questioner = new Questioner({
      initialParameters : ssoSetupOptions,
      interrogationBundle,
      output            : progressLogger
    })
    await questioner.question()

    identityStoreName = questioner.get('identity-store-name')
    identityStoreRegion = questioner.get('identity-store-region');

    ({ identityStoreARN, identityStoreID, identityStoreName, identityStoreRegion, ssoStartURL } =
      await setupSSO({ credentials, db, identityStoreName, identityStoreRegion }))

    db.sso.details.identityStoreARN = identityStoreARN
    db.sso.details.identityStoreID = identityStoreID
    db.sso.details.identityStoreName = identityStoreName
    db.sso.details.identityStoreRegion = identityStoreRegion
    db.sso.details.ssoStartURL = ssoStartURL
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
