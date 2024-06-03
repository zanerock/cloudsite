import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { GetUserIdCommand, IdentitystoreClient } from '@aws-sdk/client-identitystore'

import { cliSpec } from '../../constants'
import { ensureAdminAuthentication, removeTemporaryAccessKeys } from '../../../lib/shared/authentication-lib'
import { getOptionsSpec } from '../../lib/get-options-spec'
import { findIdentityStoreStaged } from '../../../lib/shared/find-identity-store'
import { progressLogger } from '../../../lib/shared/progress-logger'
import { SETUP_SSO_PROFILE_NAME } from '../../../lib/shared/constants'
import { setupUser } from '../../../lib/actions/setup-user'

const handler = async ({ argv, db, globalOptions, identityStoreARN, identityStoreID, identityStoreRegion }) => {
  const userCreateOptionsSpec = getOptionsSpec({ cliSpec, path : ['users', 'create'] })
  const userCreateOptions = commandLineArgs(userCreateOptionsSpec, { argv })
  let {
    'key-delete' : keyDelete,
    'no-key-delete': noKeyDelete,
    'user-email': userEmail,
    'user-family-name' : userFamilyName,
    'user-given-name' : userGivenName,
    'user-name': userName
  } = userCreateOptions

  globalOptions['sso-profile'] =
    (globalOptions.ssoCLIOverride && globalOptions['sso-profile']) || SETUP_SSO_PROFILE_NAME

  let credentials
  ({ credentials, noKeyDelete } = await ensureAdminAuthentication({ globalOptions, noKeyDelete }))

  // let's get the identity store info
  if (identityStoreARN === undefined || identityStoreID === undefined || identityStoreRegion === undefined) {
    ({ identityStoreARN, identityStoreID, identityStoreRegion } =
      await findIdentityStoreStaged({ credentials, firstCheckRegion : identityStoreRegion }))
  }

  // first, we make sure we have a user name and then search for it
  if (userName === undefined) {
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

  // are they saying create this or referencing an existing user?
  progressLogger.write(`Checking identity store for user '${userName}'...`)
  const identitystoreClient = new IdentitystoreClient({ credentials, region : identityStoreRegion })
  const getUserIdCommad = new GetUserIdCommand({
    IdentityStoreId     : identityStoreID,
    AlternateIdentifier : {
      UniqueAttribute : { AttributePath : 'userName', AttributeValue : userName }
    }
  })
  try {
    await identitystoreClient.send(getUserIdCommad)
    progressLogger.write(' FOUND.\n')
    throw new Error(`Found existing user ${userName}. To update the user, try:\n\n<code>cloudsite users ${userName} update<rst>`)
  } catch (e) {
    if (e.name !== 'ResourceNotFoundException') {
      progressLogger.write(' ERROR.\n')
      throw e // otherwise, it's just not found and we leave 'userFound' false
    }
    progressLogger.write(' NOT FOUND.\n')
  }

  // will have raised an error if user already exists, so now let's check we have all the data
  const interrogationBundle = {
    actions :
    [
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
      },
      { review : 'questions' }
    ]
  }

  const questioner = new Questioner({
    initialParameters : userCreateOptions,
    interrogationBundle,
    output            : progressLogger
  })
  await questioner.question()

  const { values } = questioner;

  ({
    'user-email': userEmail = userEmail,
    'user-family-name': userFamilyName = userFamilyName,
    'user-given-name' : userGivenName = userGivenName,
    'user-name': userName = userName
  } = values)

  // all user fields should be set at this point

  await setupUser({
    credentials,
    groupID,
    groupName,
    identityStoreID,
    identityStoreRegion,
    userEmail,
    userFamilyName,
    userGivenName,
    userName
  })

  await removeTemporaryAccessKeys({ credentials, keyDelete, noKeyDelete })

  const arnBits = identityStoreARN.split('/')
  const instanceShortID = arnBits[arnBits.length - 1].split('-')[1]

  const usersURL = `https://${identityStoreRegion}.console.aws.amazon.com/singlesignon/home?region=${identityStoreRegion}#!/instances/${instanceShortID}/users`

  progressLogger.write(`<warn>You must request AWS email '${userName}' an email verification link from the Identity Center Console<rst>.\n\n1) Navigate to the following URL:\n\n<code>${usersURL}<rst>\n\n2) Select the user '${userName}'.\n3) Click the '<em>Send email verification link<rst>'.\n\nOnce verified, you can setup their local configuration with:\n\n<code>cloudsite configuration setup<rst>\n\n`)
}

export { handler }
