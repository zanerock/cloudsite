import { ListGroupsCommand } from '@aws-sdk/client-identitystore'

const searchGroups = async ({ groupName, identityStoreClient, identityStoreID }) => {
  let nextToken, groupID
  do {
    const listGroupsCommand = new ListGroupsCommand({
      IdentityStoreId : identityStoreID,
      NextToken       : nextToken
    })
    const listGroupsCommandResult = await identityStoreClient.send(listGroupsCommand)

    for (const { GroupId: testGroupID, DisplayName: displayName } of listGroupsCommandResult.Groups) {
      if (displayName === groupName) {
        groupID = testGroupID
        break
      }
    }

    nextToken = listGroupsCommandResult.NextToken
  } while (groupID === undefined && nextToken !== undefined)

  return groupID
}

export { searchGroups }
