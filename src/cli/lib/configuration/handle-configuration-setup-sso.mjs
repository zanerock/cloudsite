import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { ConfigIniParser } from 'config-ini-parser'
import { Questioner } from 'question-and-answer'

import { IdentitystoreClient, GetUserIdCommand } from '@aws-sdk/client-identitystore'
import { SSOAdminClient } from '@aws-sdk/client-sso-admin'

import { checkAuthentication } from '../check-authentication'
import { cliSpec } from '../../constants'
import { findIdentityStore } from './lib/find-identity-store'
import { getCredentials } from '../../../lib/actions/lib/get-credentials'
import { progressLogger } from '../../../lib/shared/progress-logger'
import { setupSSO } from '../../../lib/actions/setup-sso'

const handleConfigurationSetupSSO = async ({ argv, db }) => {
  const ssoSetupOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'configuration')
    .commands.find(({ name }) => name === 'setup-sso')
    .arguments || []
  const ssoSetupOptions = commandLineArgs(ssoSetupOptionsSpec, { argv })
  let {
    defaults,
    delete: doDelete,
    'group-name': groupName = 'Cloudsite managers',
    'instance-name': instanceName,
    'instance-region': instanceRegion = 'us-east-1',
    'no-delete': noDelete,
    'policy-name': policyName = 'CloudsiteManager',
    'sso-profile': ssoProfile = 'cloudsite-manager',
    'user-email': userEmail,
    'user-family-name': userFamilyName,
    'user-given-name': userGivenName,
    'user-name': userName = 'cloudsite-manager'
  } = ssoSetupOptions

  try {
    await checkAuthentication()
  } catch (e) {
    let exitCode
    if (e.name === 'CredentialsProviderError') {
      progressLogger.write('<error>No credentials were found.<rst> Refer to cloudsite instructions on how to configure API credentials for the SSO setup process.\n')
      exitCode = 2
      process.exit(exitCode) // eslint-disable-line  no-process-exit
    } else {
      throw (e)
    }
  }

  const credentials = getCredentials()

  const identityStoreInfo = {
    name   : instanceName,
    region : instanceRegion
  }
  if (instanceName === undefined || instanceRegion === undefined) {
    const interrogationBundle = {
      actions : [
        {
          prompt    : "Do you have an existing Identity Center instance? (Answer 'no' if you don't know what that is.)",
          paramType : 'boolean',
          parameter : 'HAS_INSTANCE'
        },
        {
          condition : '!HAS_INSTANCE',
          prompt    : "Enter the preferred name for the Identity Center instance (typically based on your primary domain name with '-' instead of '.'; e.g.: foo-com):",
          parameter : 'instance-name'
        },
        {
          condition : '!HAS_INSTANCE',
          prompt    : 'Enter the preferred AWS region for the identity store instance:',
          default   : instanceRegion,
          parameter : 'instance-region'
        }
      ]
    }

    const questioner = new Questioner({
      initialParameters : ssoSetupOptions,
      interrogationBundle,
      output            : progressLogger
    })
    await questioner.question()

    if (questioner.get('HAS_INSTANCE') === true) {
      Object.assign(identityStoreInfo, await findIdentityStore({ credentials, instanceRegion }))

      if (identityStoreInfo.id === undefined) {
        throw new Error('Could not locate existing identity store.')
      }
    }
  } else {
    identityStoreInfo.ssoAdminClient = new SSOAdminClient({ credentials, region : instanceRegion })
  }

  if (identityStoreInfo.id !== undefined) {
    if (ssoSetupOptions['user-name'] === undefined && defaults !== true) {
      const questioner = new Questioner({
        interrogationBundle : {
          actions : [
            {
              prompt    : 'Enter the name of the Cloudsite manager user account to create or reference:',
              default   : userName,
              parameter : 'user-name'
            }
          ]
        },
        output : progressLogger
      })

      await questioner.question()
      userName = questioner.get('user-name')
    }
  }

  // are they saying create this or referencing an existing user?
  let userFound = false
  if (identityStoreInfo !== null) {
    progressLogger.write(`Checking identity store for user '${userName}'...`)
    const identitystoreClient = new IdentitystoreClient({ credentials, region : identityStoreInfo.region })
    const getUserIdCommad = new GetUserIdCommand({
      IdentityStoreId     : identityStoreInfo.id,
      AlternateIdentifier : {
        UniqueAttribute : { AttributePath : 'userName', AttributeValue : userName }
      }
    })
    try {
      await identitystoreClient.send(getUserIdCommad)
      progressLogger.write(' FOUND.\n')
      userFound = true // if no exception
    } catch (e) {
      if (e.name !== 'ResourceNotFoundException') {
        progressLogger.write(' ERROR.\n')
        throw e // otherwise, it's just not found and we leave 'userFound' false
      }
      progressLogger.write(' NOT FOUND.\n')
    }
  }

  const ibActions = []

  if (userFound === false) {
    ibActions.push(...[
      {
        prompt    : 'Enter the email of the Cloudsite manager user:',
        parameter : 'user-email'
      },
      {
        prompt    : 'Enter the given name of the Cloudsite manager:',
        parameter : 'user-given-name'
      },
      {
        prompt    : 'Enter the family name of the Cloudsite manager:',
        parameter : 'user-family-name'
      }
    ])
  }

  if (defaults !== true) {
    ibActions.push(...[ // note, any questions with values already set by CLI options will be skipped
      {
        prompt    : "Enter the name of the SSO profile to create or reference (enter '-' to set the default profile):",
        default   : ssoProfile,
        parameter : 'sso-profile'
      },
      {
        prompt    : 'Enter the name of the custom policy to create or reference:',
        default   : policyName,
        parameter : 'policy-name'
      },
      {
        prompt    : 'Enter the name of the Cloudsite managers group to create or reference:',
        default   : groupName,
        parameter : 'group-name'
      }
    ])
  }

  if (noDelete === undefined && doDelete === undefined) {
    ibActions.push({
      prompt    : 'Delete Access keys after SSO setup:',
      paramType : 'boolean',
      default   : 'y',
      parameter : 'do-delete'
    })
  }

  if (ibActions.length > 0) {
    ibActions.push({ review : 'questions' })

    const interrogationBundle = { actions : ibActions }

    const questioner = new Questioner({
      initialParameters : ssoSetupOptions,
      interrogationBundle,
      output            : progressLogger
    })
    await questioner.question()

    const { values } = questioner;

    ({
      'group-name': groupName = groupName,
      'policy-name': policyName = policyName,
      'sso-profile': ssoProfile = ssoProfile,
      'user-email': userEmail = userEmail,
      'user-family-name': userFamilyName = userFamilyName,
      'user-given-name' : userGivenName = userGivenName,
      'user-name': userName = userName
    } = values)

    if (doDelete === undefined && noDelete === undefined) {
      doDelete = questioner.get('do-delete')
    }
  }

  if (noDelete === true) {
    doDelete = false
  } else if (doDelete === undefined) {
    doDelete = false
  }

  const requiredFields = [
    ['group-name', groupName],
    ['policy-name', policyName],
    ['sso-profile', ssoProfile],
    ['user-name', userName]
  ]

  if (userFound === false) {
    requiredFields.push(
      ['user-email', userEmail],
      ['user-family-name', userFamilyName],
      ['user-given-name', userGivenName]
    )
  }

  for (const [label, value] of requiredFields) {
    // between the CLI options and interactive setup, the only way thees aren't set is if the user explicitly set to
    // '-' (undefined)
    if (value === undefined) {
      throw new Error(`Required parameter '${label}' is undefined.`)
    }
  }

  const { ssoStartURL, ssoRegion } = await setupSSO({
    credentials,
    db,
    doDelete,
    groupName,
    identityStoreInfo,
    instanceName,
    instanceRegion,
    policyName,
    userEmail,
    userFamilyName,
    userGivenName,
    userName
  })

  progressLogger.write('Configuring local SSO profile...')
  const configPath = fsPath.join(process.env.HOME, '.aws', 'config')
  const configContents = await fs.readFile(configPath, { encoding : 'utf8' })
  const config = new ConfigIniParser()
  config.parse(configContents)
  if (!config.isHaveSection('profile ' + ssoProfile)) {
    config.addSection('profile ' + ssoProfile)
  }
  config.set('profile ' + ssoProfile, 'sso-session', ssoProfile)
  const { accountID } = db.account
  config.set('profile ' + ssoProfile, 'sso-account-id', accountID)
  config.set('profile ' + ssoProfile, 'sso-role-name', policyName)
  if (!config.isHaveSection('sso-session ' + ssoProfile)) {
    config.addSection('sso-session ' + ssoProfile)
  }
  config.set('sso-session ' + ssoProfile, 'sso-start-url', ssoStartURL)
  config.set('sso-session ' + ssoProfile, 'sso-region', ssoRegion)
  config.set('sso-session ' + ssoProfile, 'sso-registration-scopes', 'sso:account:access')

  await fs.writeFile(configPath, config.stringify())

  return { success : true, userMessage : 'Settings updated.' }
}

export { handleConfigurationSetupSSO }
