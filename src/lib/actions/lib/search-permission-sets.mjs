import { DescribePermissionSetCommand, ListPermissionSetsCommand } from '@aws-sdk/client-sso-admin'

const searchPermissionSets = async ({ instanceARN, policyName, ssoAdminClient }) => {
  let nextToken, permissionSetARN
  do {
    const listPermissionSetsCommand = new ListPermissionSetsCommand({ InstanceArn : instanceARN })
    const listPermissionSetsResult = await ssoAdminClient.send(listPermissionSetsCommand)
    for (const testARN of listPermissionSetsResult.PermissionSets) {
      const describePermissionSetCommand = new DescribePermissionSetCommand({
        InstanceArn      : instanceARN,
        PermissionSetArn : testARN
      })
      const { Name: name } = (await ssoAdminClient.send(describePermissionSetCommand)).PermissionSet

      if (name === policyName) {
        permissionSetARN = testARN
        break
      }
    }
    nextToken = listPermissionSetsResult.NextToken
  } while (permissionSetARN === undefined && nextToken !== undefined)

  return permissionSetARN
}

export { searchPermissionSets }
