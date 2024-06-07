import { existsSync as fileExists } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { ConfigIniParser } from 'config-ini-parser'
import { Questioner } from 'question-and-answer'

import { AUTHENTICATION_PROFILE_CONTENT_MANAGER, POLICY_SITE_MANAGER_POLICY } from '../../../lib/shared/constants'
import { progressLogger } from '../../../lib/shared/progress-logger'

const handleConfigurationSetupLocal = async ({ db }) => {
  const interrogationBundle = {
    actions : [
      {
        prompt    : 'Which default format would you prefer?',
        options   : ['json', 'text', 'terminal', 'yaml'],
        default   : 'terminal',
        parameter : 'format'
      },
      {
        prompt    : "In 'quiet' mode, you only get output when an command has completed. In 'non-quiet' mode, you will receive updates as the command is processed. Would you like to activate quiet mode?",
        type      : 'boolean',
        default   : false,
        parameter : 'quiet'
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({ interrogationBundle, output : progressLogger })
  await questioner.question()

  db.account.localSettings = questioner.values

  const { account } = db
  const { localSettings = {} } = account
  account.localSettings = localSettings

  await configureAWSConfig({ db })

  return { success : true, userMessage : 'Settings updated.' }
}

const configureAWSConfig = async ({ db }) => {
  progressLogger.write('Configuring AWS profile and session... ')
  try {
    const configPath = fsPath.join(process.env.HOME, '.aws', 'config')

    if (!fileExists(configPath)) {
      await fs.mkdir(fsPath.dirname(configPath), { recursive : true })
    }

    let configContents
    try {
      configContents = await fs.readFile(configPath, { encoding : 'utf8' })
    } catch (e) {
      if (e.code === 'ENOENT') { // thet's fine
        configContents = ''
      } else {
        throw e
      }
    }

    const profileName = 'profile ' + AUTHENTICATION_PROFILE_CONTENT_MANAGER
    const sessionName = 'sso-session cloudsite'

    const config = new ConfigIniParser()
    config.parse(configContents)
    if (!config.isHaveSection(profileName)) {
      config.addSection(profileName)
    }
    config.set(profileName, 'sso_session', 'cloudsite')
    const { accountID } = db.account
    const { identityStoreRegion, ssoStartURL } = db.sso.details
    config.set(profileName, 'sso_account_id', accountID)
    config.set(profileName, 'sso_role_name', POLICY_SITE_MANAGER_POLICY)

    if (!config.isHaveSection(sessionName)) {
      config.addSection(sessionName)
    }
    config.set(sessionName, 'sso_start_url', ssoStartURL)
    config.set(sessionName, 'sso_region', identityStoreRegion)
    config.set(sessionName, 'sso_registration_scopes', 'sso:account:access')

    await fs.writeFile(configPath, config.stringify())
    progressLogger.write('DONE.\n')
  } catch (e) {
    progressLogger.write('ERROR.\n')
    throw e
  }
}

export { handleConfigurationSetupLocal }
