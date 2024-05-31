import {
  CreateGroupMembershipCommand,
  CreateUserCommand,
  ListUsersCommand
} from '@aws-sdk/client-identitystore'

import { progressLogger } from '../shared/progress-logger'

const setupUser = async ({
  groupID,
  groupName,
  identityStoreClient,
  identityStoreID,
  identityStoreRegion,
  identityStoreARN,
  ssoProfile,
  userEmail,
  userFamilyName,
  userGivenName,
  userName
}) => {
  progressLogger.write(`Checking for user '${userName}'...`)

  let nextToken, userID
  do {
    const listUsersCommand = new ListUsersCommand({
      IdentityStoreId : identityStoreID,
      NextToken       : nextToken
    })
    const listUsersResults = await identityStoreClient.send(listUsersCommand)

    for (const { UserName: testName, UserId: testID } of listUsersResults.Users) {
      if (testName === userName) {
        userID = testID
      }
    }

    nextToken = listUsersResults.NextToken
  } while (userID === undefined && nextToken !== undefined)

  if (userID !== undefined) {
    progressLogger.write(' FOUND.\n')
  } else {
    progressLogger.write(' CREATING...')

    const createUserCommand = new CreateUserCommand({
      IdentityStoreId : identityStoreID,
      UserName        : userName,
      DisplayName     : userName,
      Name            : { GivenName : userGivenName, FamilyName : userFamilyName },
      Emails          : [{ Value : userEmail, Primary : true }]
    })
    try {
      userID = (await identityStoreClient.send(createUserCommand)).UserId
      progressLogger.write(' DONE.\n')

      const arnBits = identityStoreARN.split('/')
      const instanceShortID = arnBits[arnBits.length - 1].split('-')[1]

      const usersURL = `https://${identityStoreRegion}.console.aws.amazon.com/singlesignon/home?region=${identityStoreRegion}#!/instances/${instanceShortID}/users`

      progressLogger.write(`<warn>You must request AWS email '${userName}' an email verification link from the Identity Center Console<rst>.\n\n1) Navigate to the following URL:\n\n<em>${usersURL}<rst>\n\n2) Select the user '${userName}'.\n3) Click the 'Send email verification link'.\n\nOnce verified, you can authenticate, with:\n\n<em>aws sso login --profile ${ssoProfile}<rst>\n\n`)
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }

  progressLogger.write(`Associating user '${userName}' with group '${groupName}'...`)
  const createGroupMembershipCommand = new CreateGroupMembershipCommand({
    IdentityStoreId : identityStoreID,
    GroupId         : groupID,
    MemberId        : { UserId : userID }
  })
  try {
    await identityStoreClient.send(createGroupMembershipCommand)
    progressLogger.write(' DONE.\n')
  } catch (e) {
    if (e.Reason === 'UNIQUENESS_CONSTRAINT_VIOLATION') { // already a member
      progressLogger.write(' DONE.\n')
    } else {
      progressLogger.write(' ERROR.\n')
      throw e
    }
  }
}

export { setupUser }