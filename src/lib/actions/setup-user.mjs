import { CreateGroupMembershipCommand, CreateUserCommand, IdentitystoreClient } from '@aws-sdk/client-identitystore'

import { progressLogger } from '../shared/progress-logger'

/**
 * Creates a new IAM Identity Center user.
 *
 * Note, this method expects that the existence of the user has already been checked or the caller is OK with an error
 * being raised.
 * @param {object} options - The options bundle.
 * @param {object} options.credentials - The credentials to use.
 * @param {string} options.groupID - The ID of the group to assign to the user.
 * @param {string} options.groupName - The name of group to assign to the user.
 * @param {string} options.identityStoreID - The ID of the Identity Store where the user will be created.
 * @param {string} options.identityStoreRegion - The region of the Identity Store where the user will be created.
 * @param {string} options.userEmail - The email to assign to the new user.
 * @param {string} options.userFamilyName - The family name to assign to the new user.
 * @param {string} options.userGivenName - The given name to assign to the new user.
 * @param {string} options.userName - The user name (login ID) to use for the new user.
 */
const setupUser = async ({
  credentials,
  groupID,
  groupName,
  identityStoreID,
  identityStoreRegion,
  userEmail,
  userFamilyName,
  userGivenName,
  userName
}) => {
  progressLogger.write(`Creating user '${userName}'...`)

  const identityStoreClient = new IdentitystoreClient({ credentials, region : identityStoreRegion })

  const createUserCommand = new CreateUserCommand({
    IdentityStoreId : identityStoreID,
    UserName        : userName,
    DisplayName     : userName,
    Name            : { GivenName : userGivenName, FamilyName : userFamilyName },
    Emails          : [{ Value : userEmail, Primary : true }]
  })
  let userID
  try {
    userID = (await identityStoreClient.send(createUserCommand)).UserId
    progressLogger.write(' DONE.\n')
  } catch (e) {
    progressLogger.write(' ERROR.\n')
    throw e
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
