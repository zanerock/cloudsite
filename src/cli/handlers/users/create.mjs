import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { GetUserIdCommand, IdentitystoreClient } from '@aws-sdk/client-identitystore'

import { AUTHENTICATION_PROFILE_ADMIN, POLICY_SITE_MANAGER_POLICY } from '../../../lib/shared/constants'
import { cliSpec } from '../../constants'
import { ensureAdminAuthentication, removeTemporaryAccessKeys } from '../../../lib/shared/authentication-lib'
import { getOptionsSpec } from '../../lib/get-options-spec'
import { progressLogger } from '../../../lib/shared/progress-logger'
import { setupUser } from '../../../lib/actions/setup-user'

const handler = async ({
  argv,
  db,
  globalOptions
}) => {
  const userCreateOptionsSpec = getOptionsSpec({ cliSpec, path : ['users', 'create'] })
  const userCreateOptions = commandLineArgs(userCreateOptionsSpec, { argv })
  let {
    'key-delete' : keyDelete,
    'no-error-on-existing': noErrorOnExisting,
    'no-key-delete': noKeyDelete,
    'policy-name': policyName,
    'user-email': userEmail,
    'user-family-name' : userFamilyName,
    'user-given-name' : userGivenName,
    'user-name': userName
  } = userCreateOptions

  const authProfile = (globalOptions.ssoCLIOverride && globalOptions['sso-profile']) || AUTHENTICATION_PROFILE_ADMIN

  let credentials
  ({ credentials, noKeyDelete } = await ensureAdminAuthentication({ authProfile, noKeyDelete }))

  // let's get the identity store info
  const { identityStoreARN, identityStoreID, identityStoreRegion } = db.permissions.sso

  if (identityStoreARN === undefined || identityStoreID === undefined || identityStoreRegion === undefined) {
    throw new Error("DB 'permissions.sso' field is missing or incomplete; try:\n\n<code>cloudsite import<rst>")
  }

  // first, we make sure we have a user name and then search for it
  if (userName === undefined) {
    const questioner = new Questioner({
      interrogationBundle : {
        actions : [
          {
            prompt    : 'Enter the user name of the Cloudsite manager SSO account to create or reference:',
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
    if (noErrorOnExisting === true) {
      await removeTemporaryAccessKeys({ authProfile, credentials, keyDelete, noKeyDelete })
      return { success : true, userMessage : 'User already exists' }
    }
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
        prompt    : 'Select the policy to assign to the user:',
        options   : [POLICY_SITE_MANAGER_POLICY],
        parameter : 'policy-name'
      },
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
    'policy-name': policyName = policyName,
    'user-email': userEmail = userEmail,
    'user-family-name': userFamilyName = userFamilyName,
    'user-given-name' : userGivenName = userGivenName,
    'user-name': userName = userName
  } = values)

  // all user fields should be set at this point

  const { groupID, groupName } = db.permissions.policies[policyName]

  if (groupID === undefined || groupName === undefined) {
    throw new Error(`Missing 'groupID' and/or 'groupName' definitions in local DB 'permissions.policies["${policyName}"]'. Try:\n\n<code>cloudsite import<rst>`)
  }

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

  await removeTemporaryAccessKeys({ authProfile, credentials, keyDelete, noKeyDelete })

  const arnBits = identityStoreARN.split('/')
  const instanceShortID = arnBits[arnBits.length - 1].split('-')[1]

  const usersURL = `https://${identityStoreRegion}.console.aws.amazon.com/singlesignon/home?region=${identityStoreRegion}#!/instances/${instanceShortID}/users`
  const userMessage = `<warn>You must request AWS email '${userName}' an email verification link from the Identity Center Console<rst>.\n\n1) Navigate to the following URL:\n\n<code>${usersURL}<rst>\n\n2) Select the user '${userName}'.\n3) Click the '<em>Send email verification link<rst>'.\n\nOnce verified, you can setup their local configuration with:\n\n<code>cloudsite configuration setup<rst>\n\n`

  return { success : true, userMessage }
}

export { handler }
