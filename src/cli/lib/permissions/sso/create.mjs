import { existsSync as fileExists } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { ConfigIniParser } from 'config-ini-parser'
import { Questioner } from 'question-and-answer'

import { IdentitystoreClient, GetUserIdCommand } from '@aws-sdk/client-identitystore'
import { SSOAdminClient } from '@aws-sdk/client-sso-admin'

import { checkAdminAuthentication, getCredentials } from '../../../../lib/shared/authentication-lib'
import { cliSpec } from '../../../constants'
import { DEFAULT_SSO_POLICY_NAME, DEFAULT_SSO_GROUP_NAME } from '../../../../lib/shared/constants'
import { ensureRootOrganization } from './lib/ensure-root-organization'
import { findIdentityStoreStaged } from '../../../../lib/shared/find-identity-store'
import { progressLogger } from '../../../../lib/shared/progress-logger'
import { setupSSO } from '../../../../lib/actions/setup-sso'

const create = async ({ argv, db, globalOptions }) => {
  const ssoSetupOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'permissions')
    .commands.find(({ name }) => name === 'sso')
    .commands.find(({ name }) => name === 'create')
    .arguments || []
  const ssoSetupOptions = commandLineArgs(ssoSetupOptionsSpec, { argv })
  let {
    defaults,
    delete: doDelete,
    'identity-store-name': identityStoreName,
    'identity-store-region': identityStoreRegion = 'us-east-1',
    'no-delete': noDelete,
    'user-email': userEmail,
    'user-family-name': userFamilyName,
    'user-given-name': userGivenName,
    'user-name': userName
  } = ssoSetupOptions
  let identityStoreID

  let authenticated = false
  let authenicationAttempts = 0
  let credentials
  let setupProfile = 'cloudsite-setup'
  while (authenticated === false) {
    credentials = getCredentials({ 'sso-profile': setupProfile })
    try {
      await checkAdminAuthentication({ credentials })
      authenticated = true
    } catch (e) {
      if (e.name === 'CredentialsProviderError') {
        if (authenicationAttempts > 0) {
          progressLogger.write('<warn>The previous authentication attempt failed.<rst> Was the access key information copied correctly and fully? You can try again or refer to the documentation referenced below.\n\n')
        }

        progressLogger.writeWithOptions({ breakSpacesOnly: true }, "<error>No credentials were found.<rst> You can refer to the documentation here:\n<code>https://cloudsitehosting.org/docs/get-started/authentication#initial-authentication-with-access-keys<rst>\nor simply follow the directions below.\n\n1) Log into your aws account:\n\n   <code>https://console.aws.amazon.com/<rst>\n\n2) Click the <em>account name<rst> in the upper right hand corner and select <em>Security credentials<rst>.\n3) From the IAM security credentials page, scroll down to the <em>Access keys<rst> section.\n4) Click the <em>Create access key<rst> button.\n5) Confirm you wish to create an access key and click <em>Create access key<rst>.\n\n")

        const interrogationBundle = { actions: [
          { prompt: 'Copy and paste the <em>Access key<rst> here:', parameter : 'ACCESS_KEY', requireSomething: true },
          { 
            prompt: 'Copy and paste the <em>Secret access key<rst> here:',
            parameter: 'SECRET_ACCESS_KEY', 
            requireSomething: true
          }
        ]}
        const questioner = new Questioner({ interrogationBundle, output: progressLogger })
        await questioner.question()

        const credentialsFile = fsPath.join(process.env.HOME, '.aws', 'credentials')
        const creds = new ConfigIniParser()
        if (fileExists(credentialsFile)) {
          progressLogger.write('Found existing <code>~/.aws/credentials<rst> file.\nParsing...')
          const credentialsContents = await fs.readFile(credentialsFile, { encoding: 'utf8' })
          creds.parse(credentialsContents)
          let counter = 0
          while (creds.isHaveSection(setupProfile)) {
            setupProfile = 'setup-profile-' + counter
            counter += 1
          }
        } // else, there is no previous creds file
        await fs.mkdir(fsPath.dirname(credentialsFile), { recursive: true })
        // now we can update or create the credentials file
        creds.addSection(setupProfile)
        creds.set(setupProfile, 'aws_access_key_id', questioner.get('ACCESS_KEY'))
        creds.set(setupProfile, 'aws_secret_access_key', questioner.get('SECRET_ACCESS_KEY'))

        const credsContents = creds.stringify()
        await fs.writeFile(credentialsFile, credsContents, { encoding: 'utf8' })
        // new we loop and try the authentication again
      } else {
        throw (e)
      }
    }
  }

  await ensureRootOrganization({ credentials, db });

  ({ identityStoreID, identityStoreRegion } =
    await findIdentityStoreStaged({ credentials, firstCheckRegion : identityStoreRegion }));

  if (identityStoreID === undefined) {
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
  }

  const { ssoStartURL, ssoRegion } = await setupSSO({
    credentials,
    db,
    doDelete,
    globalOptions,
    groupName,
    identityStoreARN,
    identityStoreID,
    identityStoreName,
    identityStoreRegion,
    policyName,
    ssoProfile,
    ssoStartURL,
    userEmail,
    userFamilyName,
    userGivenName,
    userName,
  })

  progressLogger.write('Configuring local SSO profile...')
  const configPath = fsPath.join(process.env.HOME, '.aws', 'config')
  const configContents = await fs.readFile(configPath, { encoding : 'utf8' })
  const config = new ConfigIniParser()
  config.parse(configContents)
  if (!config.isHaveSection('profile ' + ssoProfile)) {
    config.addSection('profile ' + ssoProfile)
  }
  config.set('profile ' + ssoProfile, 'sso_session', ssoProfile)
  const { accountID } = db.account
  config.set('profile ' + ssoProfile, 'sso_account_id', accountID)
  config.set('profile ' + ssoProfile, 'sso_role_name', policyName)
  if (!config.isHaveSection('sso-session ' + ssoProfile)) {
    config.addSection('sso-session ' + ssoProfile)
  }
  config.set('sso-session ' + ssoProfile, 'sso_start_url', ssoStartURL)
  config.set('sso-session ' + ssoProfile, 'sso_region', ssoRegion)
  config.set('sso-session ' + ssoProfile, 'sso_registration_scopes', 'sso:account:access')

  await fs.writeFile(configPath, config.stringify())

  const { account } = db
  const { localSettings = {} } = account
  account.localSettings = localSettings

  return { success : true, userMessage : 'Settings updated.', identityStoreARN, identityStoreRegion, identityStoreID }
}

export { create }
