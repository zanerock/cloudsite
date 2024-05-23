import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { ConfigIniParser } from 'config-ini-parser'
import { Questioner } from 'question-and-answer'

import { IdentitystoreClient, GetUserIdCommand } from '@aws-sdk/client-identitystore'
import { SSOAdminClient } from '@aws-sdk/client-sso-admin'

import { checkAuthentication } from '../check-authentication'
import { cliSpec } from '../../constants'
import { DEFAULT_SSO_POLICY_NAME, DEFAULT_SSO_GROUP_NAME } from '../../../lib/shared/constants'
import { ensureRootOrganization } from './lib/ensure-root-organization'
import { findIdentityStoreStaged } from '../../../lib/shared/find-identity-store'
import { getCredentials } from '../../../lib/actions/lib/get-credentials'
import { progressLogger } from '../../../lib/shared/progress-logger'
import { setupSSO } from '../../../lib/actions/setup-sso'

const handleConfigurationSetupSSO = async ({ argv, db, globalOptions }) => {
  const ssoSetupOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'configuration')
    .commands.find(({ name }) => name === 'setup-sso')
    .arguments || []
  const ssoSetupOptions = commandLineArgs(ssoSetupOptionsSpec, { argv })
  let {
    defaults,
    delete: doDelete,
    'group-name': groupName = DEFAULT_SSO_GROUP_NAME,
    'instance-name': instanceName,
    'instance-region': instanceRegion = 'us-east-1',
    'no-delete': noDelete,
    'policy-name': policyName = DEFAULT_SSO_POLICY_NAME,
    'sso-profile-name': ssoProfile = 'cloudsite-manager',
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

  await ensureRootOrganization({ credentials, db })

  const identityStoreInfo = {
    name   : instanceName,
    region : instanceRegion
  }

  Object.assign(identityStoreInfo, await findIdentityStoreStaged({ credentials, firstCheckRegion : instanceRegion }))

  if (identityStoreInfo.id === undefined) {
    const interrogationBundle = {
      actions : [
        {
          statement : "You do not appear to have an Identity Center associated with your account. The Identity Center is where you'll sign in with your SSO account."
        },
        {
          prompt    : "Enter the preferred <em>name for the Identity Center<rst> instance (typically based on your primary domain name with '-' instead of '.'; e.g.: foo-com):",
          parameter : 'instance-name'
        },
        {
          prompt    : 'Enter the preferred <em>AWS region<rst> for the identity store instance:',
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

    identityStoreInfo.instanceName = questioner.get('instance-name')
    identityStoreInfo.instanceRegion = questioner.get('instance-region');
    ({ instanceName, instanceRegion } = identityStoreInfo)
  }

  identityStoreInfo.ssoAdminClient = new SSOAdminClient({ credentials, region : instanceRegion })

  if (ssoSetupOptions['user-name'] === undefined && defaults !== true) {
    const questioner = new Questioner({
      interrogationBundle : {
        actions : [
          {
            prompt    : `Enter the name of the Cloudsite manager user account to create${identityStoreInfo.id === undefined ? '' : 'or reference'}:`,
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

  // are they saying create this or referencing an existing user?
  let userFound = false
  if (identityStoreInfo.id !== undefined) {
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
        prompt    : 'Enter the <em>email<rst> of the Cloudsite manager user:',
        parameter : 'user-email'
      },
      {
        prompt    : 'Enter the <em>given name<rst> of the Cloudsite manager:',
        parameter : 'user-given-name'
      },
      {
        prompt    : 'Enter the <em>family name<rst> of the Cloudsite manager:',
        parameter : 'user-family-name'
      }
    ])
  }

  if (defaults !== true) {
    ibActions.push(...[ // note, any questions with values already set by CLI options will be skipped
      {
        prompt    : "Enter the name of the <em>SSO profile<rst> to create or reference (enter '-' to set the default profile):",
        default   : ssoProfile,
        parameter : 'sso-profile-name'
      },
      {
        prompt    : 'Enter the name of the Cloudsite <em>policy<rst> to create or reference (<warn>it is highly recommended to use the default name if possible<rst>):',
        default   : policyName,
        parameter : 'policy-name'
      },
      {
        prompt    : 'Enter the name of the Cloudsite managers <em>group<rst> to create or reference (<warn>it is highly recommended to use the default name if possible<rst>):',
        default   : groupName,
        parameter : 'group-name'
      }
    ])
  }

  if (noDelete === undefined && doDelete === undefined) {
    ibActions.push({
      prompt    : 'Delete Access keys after SSO setup:',
      paramType : 'boolean',
      default   : true,
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
      'sso-profile-name': ssoProfile = ssoProfile,
      'user-email': userEmail = userEmail,
      'user-family-name': userFamilyName = userFamilyName,
      'user-given-name' : userGivenName = userGivenName,
      'user-name': userName = userName
    } = values)

    if (doDelete === undefined && noDelete === undefined) {
      doDelete = questioner.get('do-delete')
    }
  }

  // check and warn for non-standard names where the only way we can identify the resource is by name
  const nonStandardNames = []
  if (policyName !== DEFAULT_SSO_POLICY_NAME) {
    nonStandardNames.push('policy name')
  }
  if (groupName !== DEFAULT_SSO_GROUP_NAME) {
    nonStandardNames.push('group name')
  }
  if (nonStandardNames.length > 0) {
    const warning = `<em>WARNING<rst> Detected non-standard <em>${nonStandardNames.join('<rst> and <em>')}<rst>. Using non-standard names will require that you remember and supply the non-standard names for certain operations. For instance, if you need to rebuild the Cloudsite database on another computer. It is highly recommended that standard names be used if at all possible.`
    const interrogationBundle = {
      actions : [
        { statement : warning },
        {
          prompt    : 'Revert to standard names? (Y=revert, N=keep)',
          parameter : 'REVERT',
          paramType : 'boolean',
          default   : true
        }
      ]
    }

    const questioner = new Questioner({ interrogationBundle, output : progressLogger })
    await questioner.question()

    if (questioner.get('REVERT') === true) {
      progressLogger.write(`Reverting to standard policy name '${DEFAULT_SSO_POLICY_NAME}' and group name '${DEFAULT_SSO_GROUP_NAME}'...`)
      policyName = DEFAULT_SSO_POLICY_NAME
      groupName = DEFAULT_SSO_GROUP_NAME
    } else {
      progressLogger.write(`Retaining non-standard ${nonStandardNames.join(' and ')}...`)
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
    ['sso-profile-name', ssoProfile],
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
    globalOptions,
    groupName,
    identityStoreInfo,
    instanceName,
    policyName,
    ssoProfile,
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
  localSettings['sso-profile'] = ssoProfile

  return { success : true, userMessage : 'Settings updated.' }
}

export { handleConfigurationSetupSSO }
