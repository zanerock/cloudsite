import { 
  OrganizationsClient, 
  CreateOrganizationCommand, 
  DescribeAccountCommand, 
  EnableAWSServiceAccessCommand 
} from '@aws-sdk/client-organizations'

import { getAccountID } from '../../../lib/shared/get-account-id'
import { progressLogger } from '../../../lib/shared/progress-logger'

const ensureRootOrganization = async ({ credentials, db, globalOptions }) => {
  if (db.account.accountID === undefined) {
    db.account.accountID = await getAccountID({ credentials })
  }

  progressLogger.write('Checking if root organization present... ')
  const { accountID } = db.account

  const organizationsClient = new OrganizationsClient({ credentials })
  const describeAccountCommand = new DescribeAccountCommand({ AccountId : accountID })
  let organizationFound = false
  try {
    await organizationsClient.send(describeAccountCommand)
    progressLogger.write('FOUND\n')
    organizationFound = true
  } catch (e) {
    if (e.name === 'AccountNotFoundException') {
      progressLogger.write(`\n<error>!! ERROR !!<rst>: The account ${accountID} was not found. This may mean that you have an old Cloudsite configuration referencing a different account than the one configured to use AWS profile '${globalOptions['sso-profile']}'. Check the file:\n\n<code>~/.config/cloudsite/cloudsite-db.json<rst>\n\nIf the file exists and you are trying to use a different account, move or delete the existing file. Alternately, you may have set up credentials using the wrong account.`)
      // TODO: support 'throw-error'
      process.exit(1) // eslint-disable-line no-process-exit
    } else if (e.name !== 'AWSOrganizationsNotInUseException') {
      throw e
    } // else, there's no organization so we continue on to create one
    progressLogger.write('NOT found\n')
  }

  if (organizationFound !== true) {
    progressLogger.write('Creating root organization... ')
    const createOrganizationCommand = new CreateOrganizationCommand({ FeatureSet : 'ALL' })
    try {
      await organizationsClient.send(createOrganizationCommand)
      progressLogger.write('DONE\n')
    } catch (e) {
      progressLogger.write('ERROR\n')
      throw e
    }
  }

  progressLogger.write('Enabling Identity Center SSO Organization integration... ')
  const enableAWSServiceAccessCommand = new EnableAWSServiceAccessCommand({
    ServicePrincipal: 'sso.amazonaws.com'
  })
  try {
    await organizationsClient.send(enableAWSServiceAccessCommand)
    progressLogger.write('SUCCESS.\n')
  }
  catch (e) {
    progressLogger.write('ERROR.\n')
    throw e
  }
}

export { ensureRootOrganization }
