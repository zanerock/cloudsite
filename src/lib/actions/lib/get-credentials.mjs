import { fromIni } from '@aws-sdk/credential-providers'

const getCredentials = ({ ssoProfile }) => {
  ssoProfile = ssoProfile || process.env.AWS_PROFILE || 'default'

  const credentials = fromIni({
    profile : ssoProfile
    // Optional. The path to the shared credentials file. If not specified, the provider will use
    // the value in the `AWS_SHARED_CREDENTIALS_FILE` environment variable or a default of
    // `~/.aws/credentials`.
    // filepath: "~/.aws/credentials",
    // Optional. The path to the shared config file. If not specified, the provider will use the
    // value in the `AWS_CONFIG_FILE` environment variable or a default of `~/.aws/config`.
    // configFilepath: "~/.aws/config",
    // Optional. A function that returns a a promise fulfilled with an MFA token code for the
    // provided MFA Serial code. If a profile requires an MFA code and `mfaCodeProvider` is not a
    // valid function, the credential provider promise will be rejected.
    /* mfaCodeProvider: async (mfaSerial) => {
      return "token";
    }, */
    // Optional. Custom STS client configurations overriding the default ones.
    // clientConfig: { region },
  })

  return credentials
}

export { getCredentials }
