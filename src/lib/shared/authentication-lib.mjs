import { IAMClient, GetAccountSummaryCommand } from '@aws-sdk/client-iam'
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"
import { fromIni } from '@aws-sdk/credential-providers'

const checkAuthentication = async ({ globalOptions = {} } = {}) => {
  const credentials = getCredentials(globalOptions) // passes in 'sso-profile'

  const stsClient = new STSClient({ credentials })
  const getCallerIdentityCommand = new GetCallerIdentityCommand({})
  // we don't actually care about the result, we're just checking the auth
  await stsClient.send(getCallerIdentityCommand)

  return credentials
}

const checkAdminAuthentication = async ({ credentials } = {}) => {
  const iamClient = new IAMClient({ credentials })
  const getAccountSummaryCommand = new GetAccountSummaryCommand({ })
  // we don't actually care about the result, we're just checking the auth
  await iamClient.send(getAccountSummaryCommand)

  return credentials
}

const getCredentials = ({ 'sso-profile': ssoProfile } = {}) => {
  ssoProfile = ssoProfile || process.env.AWS_PROFILE || 'default'

  const credentials = fromIni({ profile : ssoProfile })

  return credentials
}

export { checkAuthentication, checkAdminAuthentication, getCredentials }
