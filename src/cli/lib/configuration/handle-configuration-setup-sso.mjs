import commandLineArgs from 'command-line-args'
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
  const { 'instance-name': instanceName, 'instance-region': instanceRegion = 'us-east-1' } = ssoSetupOptions

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
        prompt    : "Enter the name of the SSO profile to create or reference (enter '-' to set the default profile):",
        parameter : 'sso-profile'
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({ interrogationBundle, output : progressLogger })
  await questioner.question()

  const {
    'policy-name': policyName,
    'group-name': groupName,
    'user-name': userName,
    'sso-profile': ssoProfile
  } = questioner.values

  await setupSSO({ db, groupName, instanceName, instanceRegion, policyName, ssoProfile, userName })

  return { success : true, userMessage : 'Settings updated.' }
}

export { handleConfigurationSetupSSO }
