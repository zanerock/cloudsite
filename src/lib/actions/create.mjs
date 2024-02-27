import { ACMClient, RequestCertificateCommand } from '@aws-sdk/client-acm'
import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3"
import { fromIni } from '@aws-sdk/credential-providers'

const create = async ({ apexDomain, bucketName, region, sourcePath, /* sourceType, */ siteInfo, ssoProfile }) => {
  const credentials = fromIni({
    // Optional. The configuration profile to use. If not specified, the provider will use the value
    // in the `AWS_PROFILE` environment variable or a default of `default`.
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

  const CertificateArn = await createCertificate({ apexDomain, credentials })
  siteInfo.certificateArn = CertificateArn
  await createS3Bucket({ apexDomain, bucketName, credentials, region, siteInfo })
  console.log('siteInfo:', siteInfo) // DEBUG
}

const convertDomainToBucketName = (domain) => domain.replaceAll(/\./g, '-').replaceAll(/[^a-z0-9-]/g, 'x')

const createCertificate = async ({ apexDomain, credentials, siteInfo}) => {
  const client = new ACMClient({
    credentials,
    region : 'us-east-1' // N. Virginia; required for certificate request
  })
  const input = { // RequestCertificateRequest
    DomainName       : '*.' + apexDomain, // TODO: support more narrow cert?
    ValidationMethod : 'DNS', // TODO: support email
    /* SubjectAlternativeNames: [ // DomainList TODO: support alt names once we support a narrowed
      "STRING_VALUE",
    ], */
    // IdempotencyToken: "STRING_VALUE", TODO: should we use this?
    /* DomainValidationOptions: [ // DomainValidationOptionList : TODO: is this only used for email verification?
      { // DomainValidationOption
        DomainName: "STRING_VALUE", // required
        ValidationDomain: "STRING_VALUE", // required
      },
    ], */
    Options          : { // CertificateOptions
      CertificateTransparencyLoggingPreference : 'ENABLED'
    },
    // CertificateAuthorityArn: "STRING_VALUE", TODO: only used for private certs, I think
    /* Tags: [ // TagList : TODO: support tags? tag with the website
      { // Tag
        Key: "STRING_VALUE", // required
        Value: "STRING_VALUE",
      },
    ], */
    KeyAlgorithm : 'RSA_2048' // TODO: support key options"RSA_1024" || "RSA_2048" || "RSA_3072" || "RSA_4096" || "EC_prime256v1" || "EC_secp384r1" || "EC_secp521r1",
  }
  // this method can safely be called multiple times; it'll  match  existing certs (by domain name I'd assume)
  const command = new RequestCertificateCommand(input)
  const response = await client.send(command)

  const { CertificateArn } = response

  return CertificateArn
}

const createS3Bucket = async ({ apexDomain, bucketName, credentials, region, siteInfo }) => {
  if (bucketName === undefined) {
    bucketName = siteInfo.bucketName || convertDomainToBucketName(apexDomain)
  }
  // else, we use the explicit bucketName provided

  const client = new S3Client({ credentials })
  const input = {
    Bucket: bucketName,
    ObjectOwnership: 'BucketOwnerEnforced'
  }
  if (region !== 'us-east-1' && region !== undefined) {
    input.CreateBucketConfiguration = {
      LocationConstraint: region
    }
  }

  const command = new CreateBucketCommand(input)
  const response = await client.send(command)

  const { Location } = response

  siteInfo.bucketName = Location.replace(/^\//, '')
}

export { create }
