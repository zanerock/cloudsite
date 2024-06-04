import { DescribePermissionSetCommand, ListPermissionSetsCommand } from '@aws-sdk/client-sso-admin'

const searchPermissionSets = async ({ identityStoreARN, policyName, ssoAdminClient }) => {
  let nextToken
  do {
    const listPermissionSetsCommand = new ListPermissionSetsCommand({ InstanceArn : identityStoreARN })
    const listPermissionSetsResult = await ssoAdminClient.send(listPermissionSetsCommand)
    for (const permissionSetARN of listPermissionSetsResult.PermissionSets) {
      const describePermissionSetCommand = new DescribePermissionSetCommand({
        InstanceArn      : identityStoreARN,
        PermissionSetArn : permissionSetARN
      })
      const { Name: name } = (await ssoAdminClient.send(describePermissionSetCommand)).PermissionSet

      if (name === policyName) {
        return permissionSetARN
      }
    }
    nextToken = listPermissionSetsResult.NextToken
  } while (nextToken !== undefined) // exits via return if a match is made

  return undefined
}

export { searchPermissionSets }
