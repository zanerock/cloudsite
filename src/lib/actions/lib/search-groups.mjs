import { ListGroupsCommand } from '@aws-sdk/client-identitystore'

const searchGroups = async ({ groupName, identityStoreClient, identityStoreID }) => {
  let nextToken
  do {
    const listGroupsCommand = new ListGroupsCommand({
      IdentityStoreId : identityStoreID,
      NextToken       : nextToken
    })
    const listGroupsCommandResult = await identityStoreClient.send(listGroupsCommand)

    for (const { GroupId: groupID, DisplayName: displayName } of listGroupsCommandResult.Groups) {
      if (displayName === groupName) {
        return groupID
      }
    }

    nextToken = listGroupsCommandResult.NextToken
  } while (nextToken !== undefined) // exits via 'return' if a match is made

  return undefined
}

export { searchGroups }
