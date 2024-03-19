import { ListCertificatesCommand } from '@aws-sdk/client-acm'

import { progressLogger } from '../../shared/progress-logger'

const findCertificate = async ({ apexDomain, acmClient }) => {
  progressLogger?.write('Searching for existing certificate... ')
  let nextToken
  do {
    const listCertificatesCommand = new ListCertificatesCommand({
      CertificateStatuses : ['PENDING_VALIDATION', 'ISSUED']
    })
    const listResponse = await acmClient.send(listCertificatesCommand)

    const domain = '*.' + apexDomain
    for (const { CertificateArn, DomainName, Status } of listResponse.CertificateSummaryList) {
      if (DomainName === domain) {
        progressLogger?.write('FOUND\n')
        return { certificateArn : CertificateArn, status : Status }
      }
    }
    nextToken = listResponse.NextToken
  } while (nextToken !== undefined)

  // if we fall out of the loop without returning, then we never found the named domain
  progressLogger?.write('NOT found')
  return { certificateArn : null, status : null }
}

export { findCertificate }
