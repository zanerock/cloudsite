import { existsSync as fileExists } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import { ConfigIniParser } from 'config-ini-parser'
import { Questioner } from 'question-and-answer'

import { DeleteAccessKeyCommand, IAMClient, GetAccountSummaryCommand, ListAccessKeysCommand } from '@aws-sdk/client-iam'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { fromIni } from '@aws-sdk/credential-providers'

import { progressLogger } from './progress-logger'

const checkAuthentication = async ({ globalOptions = {} } = {}) => {
  const credentials = getCredentials(globalOptions) // passes in 'sso-profile'

  const stsClient = new STSClient({ credentials })
  const getCallerIdentityCommand = new GetCallerIdentityCommand({})
  // we don't actually care about the result, we're just checking the auth
  await stsClient.send(getCallerIdentityCommand)

  return credentials
}

const checkAdminAuthentication = async ({ credentials } = {}) => {
  const iamClient = new IAMClient({ credentials })
  const getAccountSummaryCommand = new GetAccountSummaryCommand({ })
  // we don't actually care about the result, we're just checking the auth
  await iamClient.send(getAccountSummaryCommand)

  return credentials
}

const ensureAdminAuthentication = async ({ globalOptions, noKeyDelete }) => {
  let authenticated = false
  const authenticationAttempts = 0
  let credentials
  let hasProfile = false
  const ssoProfile = globalOptions['sso-profile']

  const credentialsFile = fsPath.join(process.env.HOME, '.aws', 'credentials')
  const creds = new ConfigIniParser()
  if (fileExists(credentialsFile)) {
    progressLogger.write('Found existing <code>~/.aws/credentials<rst> file.\nParsing... ')
    try {
      const credentialsContents = await fs.readFile(credentialsFile, { encoding : 'utf8' })
      creds.parse(credentialsContents)
      progressLogger.write('DONE.\n')
    } catch (e) {
      progressLogger.write('ERROR.\n')
      throw e
    }

    if (creds.isHaveSection(globalOptions['sso-profile']) === true) {
      hasProfile = true
      // if there is an existing key set, we retain it by default
      noKeyDelete = noKeyDelete !== undefined ? true : noKeyDelete
    }
  } else { // there is no previous creds file
    await fs.mkdir(fsPath.dirname(credentialsFile), { recursive : true })
  }
  if (hasProfile === false) {
    creds.addSection(ssoProfile)
  }

  while (authenticated === false) {
    // the caller should do any special settings for global options
    credentials = getCredentials(globalOptions)
    try {
      progressLogger.write('Checking admin authentication... ')
      await checkAdminAuthentication({ credentials })
      progressLogger.write('AUTHENTICATED.\n')
      authenticated = true
    } catch (e) {
      if (e.name === 'CredentialsProviderError') {
        progressLogger.write('NOT authenticated.\n')

        if (authenticationAttempts > 0) {
          progressLogger.write('<warn>The previous authentication attempt failed.<rst> Was the access key information copied correctly and fully? You can try again or refer to the documentation referenced below.\n\n')
        }
        const errorMsg = authenticationAttempts === 0
          ? 'No credentials were found.'
          : 'Failed to authenticate with credentials.'

        progressLogger.writeWithOptions({ breakSpacesOnly : true }, `<error>${errorMsg}<rst> You can refer to the documentation here:\n<code>https://cloudsitehosting.org/docs/get-started/authentication#initial-authentication-with-access-keys<rst>\nor simply follow the directions below.\n\n1) Log into your aws account:\n\n   <code>https://console.aws.amazon.com/<rst>\n\n2) Click the <em>account name<rst> in the upper right hand corner and select <em>Security credentials<rst>.\n3) From the IAM security credentials page, scroll down to the <em>Access keys<rst> section.\n4) Click the <em>Create access key<rst> button.\n5) Confirm you wish to create an access key and click <em>Create access key<rst>.\n\n`)

        const interrogationBundle = {
          actions : [
            { prompt : 'Copy and paste the <em>Access key<rst> here:', parameter : 'ACCESS_KEY', requireSomething : true },
            {
              prompt           : 'Copy and paste the <em>Secret access key<rst> here:',
              parameter        : 'SECRET_ACCESS_KEY',
              requireSomething : true
            }
          ]
        }
        const questioner = new Questioner({ interrogationBundle, output : progressLogger })
        await questioner.question()

        creds.set(ssoProfile, 'aws_access_key_id', questioner.get('ACCESS_KEY'))
        creds.set(ssoProfile, 'aws_secret_access_key', questioner.get('SECRET_ACCESS_KEY'))

        const credsContents = creds.stringify()
        await fs.writeFile(credentialsFile, credsContents, { encoding : 'utf8' })
        // new we loop and try the authentication again
      } else { // error is something other than 'CredentialsProviderError'
        progressLogger.write('ERROR.\n')
        throw (e)
      }
    }
  } // while (authenticated === false)

  return { credentials, noKeyDelete }
}

const getCredentials = ({ 'sso-profile': ssoProfile } = {}) => {
  ssoProfile = ssoProfile || process.env.AWS_PROFILE || 'default'

  const credentials = fromIni({ profile : ssoProfile })

  return credentials
}

const removeTemporaryAccessKeys = async ({ credentials, keyDelete, noKeyDelete }) => {
  if (noKeyDelete === undefined && keyDelete === undefined) {
    const interrogationBundle = {
      actions : [
        {
          prompt    : 'Delete Access keys after SSO setup:',
          paramType : 'boolean',
          default   : true,
          parameter : 'do-delete'
        }
      ]
    }
    const questioner = new Questioner({ interrogationBundle, output : progressLogger })
    await questioner.question()

    keyDelete = questioner.get('do-delete')
  }

  if (noKeyDelete === true) {
    keyDelete = false
  } else if (keyDelete === undefined) {
    keyDelete = false
  }

  if (keyDelete === true) {
    const iamClient = new IAMClient({ credentials })
    progressLogger.write('Checking Access Keys...')

    let marker
    let accessKeyID = false
    let activeCount = 0
    do {
      const listAccessKeysCommand = new ListAccessKeysCommand({
        Marker : marker
      })
      const listAccessKeysResult = await iamClient.send(listAccessKeysCommand)
      for (const { AccessKeyId: testKeyID, Status: status } of listAccessKeysResult.AccessKeyMetadata) {
        if (status === 'Active') {
          accessKeyID = activeCount === 0 && testKeyID
          activeCount += 1
        }
      }

      marker = listAccessKeysResult.Marker
    } while (accessKeyID === undefined && marker !== undefined)

    if (accessKeyID === false && activeCount > 1) {
      progressLogger.write(' MULTIPLE keys found.\nSkipping Access Key deletion.')
    } else if (accessKeyID === false) {
      progressLogger.write(' NO KEYS FOUND.\n')
    } else {
      progressLogger.write(' DELETING...')
      const deleteAccessKeyCommand = new DeleteAccessKeyCommand({ AccessKeyId : accessKeyID })

      try {
        await iamClient.send(deleteAccessKeyCommand)
        progressLogger.write('  DONE.\n')
      } catch (e) {
        progressLogger.write('  ERROR.\n')
        throw e
      }
    }
  } else {
    progressLogger.write('Leaving Access Keys in place.\n')
  }
}

export {
  checkAuthentication,
  checkAdminAuthentication,
  ensureAdminAuthentication,
  getCredentials,
  removeTemporaryAccessKeys
}
