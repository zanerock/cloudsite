import { fromIni } from '@aws-sdk/credential-providers'

const getCredentials = ({ 'sso-profile': ssoProfile }) => {
  ssoProfile = ssoProfile || process.env.AWS_PROFILE || 'default'

  const credentials = fromIni({ profile : ssoProfile })

  return credentials
}

export { getCredentials }
