import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import commandLineArgs from 'command-line-args'
import { ConfigIniParser } from 'config-ini-parser'
import { Questioner } from 'question-and-answer'

import { checkAuthentication } from '../check-authentication'
import { cliSpec } from '../../constants'
import { progressLogger } from '../../../lib/shared/progress-logger'
import { setupSSO } from '../../../lib/actions/setup-sso'

const handleConfigurationSetupSSO = async ({ argv, db }) => {
  const ssoSetupOptionsSpec = cliSpec
    .commands.find(({ name }) => name === 'configuration')
    .commands.find(({ name }) => name === 'setup-sso')
    .arguments || []
  const ssoSetupOptions = commandLineArgs(ssoSetupOptionsSpec, { argv })
  let {
    'group-name': groupName,
    'instance-name': instanceName,
    'instance-region': instanceRegion,
    'policy-name': policyName,
    'sso-profile': ssoProfile,
    'user-email': userEmail,
    'user-name': userName
  } = ssoSetupOptions

  try {
    await checkAuthentication()
  } catch (e) {
    let exitCode
    if (e.name === 'CredentialsProviderError') {
      progressLogger.write('<error>No credentials were found.<rst> Refer to cloudsite home instructions on how to configure API credentials for the SSO setup process.\n')
      exitCode = 2
      process.exit(exitCode) // eslint-disable-line  no-process-exit
    } else {
      throw (e)
    }
  }

  // TODO: process argv for options
  const interrogationBundle = {
    actions : [
      {
        prompt    : 'Enter the preferred name for the identity store instance:',
        parameter : 'instance-name'
      },
      {
        prompt    : 'Enter the preferred AWS region for the identity store instance:',
        default   : 'us-east-1',
        parameter : 'instance-region'
      },
      {
        prompt    : 'Enter the name of the custom policy to create or reference:',
        default   : 'CloudsiteManager',
        parameter : 'policy-name'
      },
      {
        prompt    : 'Enter the name of the Cloudsite managers group to create or reference:',
        default   : 'Cloudsite managers',
        parameter : 'group-name'
      },
      {
        prompt    : 'Enter the name of the Cloudsite manager user account to create or reference:',
        default   : 'cloudsite-manager',
        parameter : 'user-name'
      },
      {
        prompt    : 'Enter the email of the Cloudsite manager user:',
        parameter : 'user-email'
      },
      {
        prompt    : "Enter the name of the SSO profile to create or reference (enter '-' to set the default profile):",
        default   : 'cloudsite-manager',
        parameter : 'sso-profile'
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({ initialParameters : ssoSetupOptions, interrogationBundle, output : progressLogger })
  await questioner.question();

  ({
    'group-name': groupName,
    'instance-name': instanceName,
    'instance-region': instanceRegion,
    'policy-name': policyName,
    'sso-profile': ssoProfile,
    'user-email': userEmail,
    'user-name': userName
  } = questioner.values)

  const { ssoStartURL, ssoRegion } =
    await setupSSO({ db, groupName, instanceName, instanceRegion, policyName, userEmail, userName })

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
