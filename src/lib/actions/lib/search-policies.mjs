import { ListPoliciesCommand } from '@aws-sdk/client-iam'

const searchPolicies = async ({ iamClient, policyName }) => {
  let marker
  do {
    const listPoliciesCommand = new ListPoliciesCommand({
      Scope             : 'Local',
      PolicyUsageFilter : 'PermissionsPolicy',
      Marker            : marker
    })

    const listPoliciesResults = await iamClient.send(listPoliciesCommand)

    for (const { PolicyName: testPolicyName, Arn: arn } of listPoliciesResults.Policies) {
      if (testPolicyName.toLowerCase() === policyName.toLowerCase()) { // policy names must be case-insensitive unique
        return arn
      }
    }

    marker = listPoliciesResults.Marker
  } while (marker !== undefined) // exits via return if a match is made

  return undefined
}

export { searchPolicies }
