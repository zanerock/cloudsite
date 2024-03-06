import { ACMClient, ListCertificatesCommand, RequestCertificateCommand } from '@aws-sdk/client-acm'
import {
  CloudFormationClient,
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation'

import { convertDomainToBucketName } from '../shared/convert-domain-to-bucket-name'
import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'
import { determineBucketName } from '../shared/determine-bucket-name'
import { errorOut } from '../../cli/lib/error-out'
import { getCredentials } from './lib/get-credentials'
import * as plugins from '../plugins'
import { SiteTemplate } from './lib/site-template'
import { syncSiteContent } from './lib/sync-site-content'

const RECHECK_WAIT_TIME = 2000 // ms
const STACK_CREATE_TIMEOUT = 30 // min

const create = async ({
  noBuild,
  noDeleteOnFailure,
  siteInfo,
  ...downstreamOptions
}) => {
  const { apexDomain } = siteInfo
  let { bucketName } = siteInfo

  const credentials = getCredentials(downstreamOptions)

  const acmClient = new ACMClient({
    credentials,
    region : 'us-east-1' // N. Virginia; required for certificate request
  })

  let { certificateArn, status } = await findCertificate({ acmClient, apexDomain })
  if (certificateArn === null) {
    process.stdout.write(`Creating wildcard certificate for '${apexDomain}'...`)
    certificateArn = await createCertificate({ acmClient, apexDomain })
    status = 'PENDING_VALIDATION'
  }
  siteInfo.certificateArn = certificateArn

  if (status === 'PENDING_VALIDATION') {
    const accountLocalCertID = certificateArn.replace(/[^/]+\/(.+)/, '$1')
    const certificateConsoleURL =
      `https://us-east-1.console.aws.amazon.com/acm/home?region=us-east-1#/certificates/${accountLocalCertID}`
    throw new Error(`Wildcard certificate for '${apexDomain}' found, but requires validation. Please validate the certificate. To validate on S3 when using Route 53 for DNS service, try navigating to the folliwng URL and select 'Create records in Route 53'::\n\n${certificateConsoleURL}\n\nSubsequent validation may take up to 30 minutes. For further documentation:\n\nhttps://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html`)
  }

  bucketName = await determineBucketName({ bucketName, credentials, siteInfo })
  siteInfo.bucketName = bucketName
  const stackCreated = await createSiteStack({ credentials, noDeleteOnFailure, siteInfo })

  if (stackCreated === true) {
    const postUpdateHandlers = Object.keys(siteInfo.pluginSettings || {}).map((pluginKey) =>
      [pluginKey, plugins[pluginKey].postUpdateHandler]
    )

    await updateSiteInfo({ credentials, siteInfo }) // needed by createOrUpdateDNSRecords
    await Promise.all([
      syncSiteContent({ credentials, noBuild, siteInfo }),
      createOrUpdateDNSRecords({ credentials, siteInfo }),
      ...postUpdateHandlers.map(([pluginKey, handler]) =>
        handler({ settings : siteInfo.pluginSettings[pluginKey], siteInfo }))
    ])

    process.stdout.write('Stack created.\n')
  } else {
    errorOut('Stack creation error.\n')
  }
}

const findCertificate = async ({ apexDomain, acmClient, nextToken }) => {
  process.stdout.write('Searching for existing certificate...\n')
  const listCertificateInput = { CertificateStatuses : ['PENDING_VALIDATION', 'ISSUED'] }
  const listCertificatesCommand = new ListCertificatesCommand(listCertificateInput)
  const listResponse = await acmClient.send(listCertificatesCommand)

  const domain = '*.' + apexDomain
  for (const { CertificateArn, DomainName, Status } of listResponse.CertificateSummaryList) {
    if (DomainName === domain) {
      return { certificateArn : CertificateArn, status : Status }
    }
  }
  nextToken = listResponse.NextToken
  if (nextToken !== undefined) {
    return await findCertificate({ apexDomain, acmClient, nextToken })
  }
  // else
  return { certificateArn : null, status : null }
}

const createCertificate = async ({ acmClient, apexDomain }) => {
  process.stdout.write(`Creating wildcard certificate for '${apexDomain}'...`)
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

const createSiteStack = async ({ credentials, noDeleteOnFailure, siteInfo }) => {
  const { apexDomain, region } = siteInfo

  const siteTemplate = new SiteTemplate({ credentials, siteInfo })
  await siteTemplate.loadPlugins()

  const cloudFormationTemplate = siteTemplate.render()

  console.log('cloudFormationTemplate:', cloudFormationTemplate) // DEBUG

  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const stackName = siteInfo.stackName || convertDomainToBucketName(apexDomain) + '-stack'
  const createInput = {
    StackName        : stackName,
    TemplateBody     : cloudFormationTemplate,
    DisableRollback  : false,
    Capabilities     : ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
    TimeoutInMinutes : STACK_CREATE_TIMEOUT
  }
  const createCommand = new CreateStackCommand(createInput)
  const createResponse = await cloudFormationClient.send(createCommand)

  const { StackId } = createResponse

  siteInfo.stackName = stackName
  siteInfo.stackArn = StackId

  const stackCreated = await trackStackCreationStatus({ cloudFormationClient, noDeleteOnFailure, stackName })
  return stackCreated
}

const trackStackCreationStatus = async ({ cloudFormationClient, noDeleteOnFailure, stackName }) => {
  let stackStatus, previousStatus
  do {
    const describeInput = { StackName : stackName }
    const describeCommand = new DescribeStacksCommand(describeInput)
    const describeResponse = await cloudFormationClient.send(describeCommand)

    stackStatus = describeResponse.Stacks[0].StackStatus

    if (stackStatus === 'CREATE_IN_PROGRESS' && previousStatus === undefined) {
      process.stdout.write('Creating stack')
    } else if (stackStatus === 'ROLLBACK_IN_PROGRESS' && previousStatus !== 'ROLLBACK_IN_PROGRESS') {
      process.stdout.write('\nRollback in progress')
    } else {
      process.stdout.write('.')
    }

    previousStatus = stackStatus
    await new Promise(resolve => setTimeout(resolve, RECHECK_WAIT_TIME))
  } while (stackStatus.match(/_IN_PROGRESS$/))

  if (stackStatus === 'ROLLBACK_COMPLETE' && noDeleteOnFailure !== true) {
    process.stdout.write(`\nDeleting stack '${stackName}'... `)
    const deleteInput = { StackName : stackName }
    const deleteCommand = new DeleteStackCommand(deleteInput)
    await cloudFormationClient.send(deleteCommand)

    process.stdout.write('done.\n')
  } else {
    process.stdout.write('\nStack status: ' + stackStatus + '\n')
  }

  return stackStatus === 'CREATE_COMPLETE'
}

const updateSiteInfo = async ({ credentials, siteInfo }) => {
  const { region, stackName } = siteInfo
  process.stdout.write('Gathering information from stack...\n')
  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const describeCommand = new DescribeStacksCommand({ StackName : stackName })
  const describeResponse = await cloudFormationClient.send(describeCommand)
  const cloudFrontDistributionID = describeResponse
    .Stacks[0].Outputs.find(({ OutputKey }) => OutputKey === 'SiteCloudFrontDistribution').OutputValue

  siteInfo.cloudFrontDistributionID = cloudFrontDistributionID
}

export { create }
