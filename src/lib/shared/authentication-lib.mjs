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

const ensureAdminAuthentication = async ({ authProfile, noKeyDelete }) => {
  progressLogger.write(`Checking admin authentication using authentication profile '${authProfile}'.`)
  let authenticated = false
  const authenticationAttempts = 0
  let credentials

  const credsINI = await getCredentialsINI()

  if (credsINI.isHaveSection(authProfile) === true) {
    // if there is an existing key set, we retain it by default
    noKeyDelete = noKeyDelete === undefined ? true : noKeyDelete
  } else {
    credsINI.addSection(authProfile)
  }

  while (authenticated === false) {
    // the caller should do any special settings for global options
    credentials = getCredentials({ 'sso-profile' : authProfile })
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
          ? 'No admin/super-user credentials were found.'
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

        credsINI.set(authProfile, 'aws_access_key_id', questioner.get('ACCESS_KEY'))
        credsINI.set(authProfile, 'aws_secret_access_key', questioner.get('SECRET_ACCESS_KEY'))

        await saveCredentialsINI()
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

const credsINIFile = fsPath.join(process.env.HOME, '.aws', 'credentials')

const getCredentialsINI = async () => {
  const credsINI = new ConfigIniParser()
  if (fileExists(credsINIFile)) {
    progressLogger.write('Found existing <code>~/.aws/credentials<rst> file.\nParsing... ')
    try {
      const credentialsContents = await fs.readFile(credsINIFile, { encoding : 'utf8' })
      credsINI.parse(credentialsContents)
      progressLogger.write('DONE.\n')
    } catch (e) {
      progressLogger.write('ERROR.\n')
      throw e
    }
  } else { // there is no previous creds file; let's make sure we can write one later
    await fs.mkdir(fsPath.dirname(credsINIFile), { recursive : true })
  }

  return credsINI
}

const saveCredentialsINI = async ({ credsINI }) => {
  const credsINIContents = credsINI.stringify()
  await fs.writeFile(credsINIFile, credsINIContents, { encoding : 'utf8' })
}

const removeTemporaryAccessKeys = async ({ authProfile, credentials, keyDelete, noKeyDelete }) => {
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

      progressLogger.write(`Updating <code>~/.aws/credentials<rst>; removing '${authProfile}' section... `)
      const credsINI = await getCredentialsINI()
      credsINI.removeSection(authProfile)
      await saveCredentialsINI({ credsINI })
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
