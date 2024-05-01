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

    progressLogger.write(`\n<warn>Attention!<rst>\nAn SSL certificate for ${apexDomain} was ${ certCreated === true ? 'created' : 'found'}, but it requires validation.\n\nTo validate the certificate, navigate to the following URL and click the 'Create records in Route 53' button.\n\n<em>${certificateConsoleURL}<rst>\n\nSubsequent validation may take up to 30 minutes. For further documentation see:\n\nhttps://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html\n`)

    throw new Error(apexDomain + ' certificate must be verified.', { cause: 'setup required' })
  }
}

export { ensureSSLCertificate }