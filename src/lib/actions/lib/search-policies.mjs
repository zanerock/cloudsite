import { ListPoliciesCommand } from '@aws-sdk/client-iam'

const searchPolicies = async ({ iamClient, policyName }) => {
  let marker, policyARN
  do {
    const listPoliciesCommand = new ListPoliciesCommand({
      Scope             : 'Local',
      PolicyUsageFilter : 'PermissionsPolicy',
      Marker            : marker
    })

    const listPoliciesResults = await iamClient.send(listPoliciesCommand)

    for (const { PolicyName: testPolicyName, Arn: arn } of listPoliciesResults.Policies) {
      if (testPolicyName.toLowerCase() === policyName.toLowerCase()) { // policy names must be case-insensitive unique
        policyARN = arn
        break
      }
    }

    marker = listPoliciesResults.Marker
  } while (policyARN === undefined && marker !== undefined)

  return policyARN
}

export { searchPolicies }
