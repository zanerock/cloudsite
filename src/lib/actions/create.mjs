import { ACMClient, RequestCertificateCommand } from "@aws-sdk/client-acm"
import { fromIni } from "@aws-sdk/credential-providers"

const create = async ({ apexDomain, sourcePath, sourceType, profile }) => {
  // process.stdout.write(`TODO: create ${apexDomain} of type ${sourceType}; source: ${sourcePath}\n`)

  const credentials = fromIni({
    // Optional. The configuration profile to use. If not specified, the provider will use the value
    // in the `AWS_PROFILE` environment variable or a default of `default`.
    profile,
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
    /*mfaCodeProvider: async (mfaSerial) => {
      return "token";
    },*/
    // Optional. Custom STS client configurations overriding the default ones.
    // clientConfig: { region },
  })

  const client = new ACMClient({
    credentials,
    region: 'us-east-1' // N. Virginia; required for certificate request
  });
  const input = { // RequestCertificateRequest
    DomainName: '*.' + apexDomain, // TODO: support more narrow cert?
    ValidationMethod: "DNS", // TODO: support email
    /* SubjectAlternativeNames: [ // DomainList TODO: support alt names once we support a narrowed
      "STRING_VALUE",
    ],*/
    // IdempotencyToken: "STRING_VALUE", TODO: should we use this?
    /* DomainValidationOptions: [ // DomainValidationOptionList : TODO: is this only used for email verification?
      { // DomainValidationOption
        DomainName: "STRING_VALUE", // required
        ValidationDomain: "STRING_VALUE", // required
      },
    ],*/
    Options: { // CertificateOptions
      CertificateTransparencyLoggingPreference: "ENABLED"
    },
    // CertificateAuthorityArn: "STRING_VALUE", TODO: only used for private certs, I think
    /* Tags: [ // TagList : TODO: support tags? tag with the website
      { // Tag
        Key: "STRING_VALUE", // required
        Value: "STRING_VALUE",
      },
    ], */
    KeyAlgorithm: "RSA_2048" // TODO: support key options"RSA_1024" || "RSA_2048" || "RSA_3072" || "RSA_4096" || "EC_prime256v1" || "EC_secp384r1" || "EC_secp521r1",
  }
  // this method can safely be called multiple times; it'll  match  existing certs (by domain name I'd assume)
  const command = new RequestCertificateCommand(input)
  const response = await client.send(command)

  const { CertificateArn } = response

  process.stdout.write('CertificateArn: ' + CertificateArn + '\n')
  process.stdout.write(JSON.stringify(response))
}

export { create }