import { ACMClient, RequestCertificateCommand } from '@aws-sdk/client-acm'

import { findCertificate } from './lib/find-certificate'
import { getCredentials } from './lib/get-credentials'
import { progressLogger } from '../shared/progress-logger'

const ensureSSLCertificate = async ({ apexDomain, db, siteInfo }) => {
  const credentials = getCredentials(db.account.localSettings)

  const acmClient = new ACMClient({
    credentials,
    region : 'us-east-1' // N. Virginia; required for certificate request
  })

  let certCreated = false
  let { certificateArn, status } = await findCertificate({ acmClient, apexDomain })
  if (certificateArn === null) {
    progressLogger.write(`Creating wildcard certificate for '${apexDomain}'...`)
    certificateArn = await createCertificate({ acmClient, apexDomain })
    status = 'PENDING_VALIDATION'
    certCreated = true
  }
  siteInfo.certificateArn = certificateArn

  if (status === 'PENDING_VALIDATION') {
    const accountLocalCertID = certificateArn.replace(/[^/]+\/(.+)/, '$1')
    const certificateConsoleURL =
      `https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/${accountLocalCertID}`

    progressLogger.write(`\n<warn>Attention!<rst>\nAn SSL certificate for ${apexDomain} was ${certCreated === true ? 'created' : 'found'}, but it requires validation.\n\nTo validate the certificate, navigate to the following URL and click the 'Create records in Route 53' button.\n\n<em>${certificateConsoleURL}<rst>\n\nSubsequent validation may take up to 30 minutes. For further documentation see:\n\nhttps://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html\n`)

    throw new Error(apexDomain + ' certificate must be verified.', { cause : 'setup required' })
  }
}

const createCertificate = async ({ acmClient, apexDomain }) => {
  progressLogger.write(`Creating wildcard certificate for '${apexDomain}'...`)
  const input = { // RequestCertificateRequest
    DomainName              : '*.' + apexDomain, // TODO: support more narrow cert?
    ValidationMethod        : 'DNS', // TODO: support email
    SubjectAlternativeNames : [
      apexDomain, 'www.' + apexDomain
    ], /*
    // IdempotencyToken: "STRING_VALUE", TODO: should we use this?
    /* DomainValidationOptions: [ // DomainValidationOptionList : TODO: is this only used for email verification?
      { // DomainValidationOption
        DomainName: "STRING_VALUE", // required
        ValidationDomain: "STRING_VALUE", // required
      },
    ], */
    Options : { // CertificateOptions
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
  const response = await acmClient.send(command)

  const { CertificateArn } = response

  return CertificateArn
}

export { ensureSSLCertificate }
