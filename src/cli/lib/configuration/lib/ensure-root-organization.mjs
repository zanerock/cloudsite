import { OrganizationsClient, CreateOrganizationCommand, DescribeAccountCommand } from '@aws-sdk/client-organizations'

import { getAccountID } from '../../../../lib/shared/get-account-id'
import { progressLogger } from '../../../../lib/shared/progress-logger'

const ensureRootOrganization = async ({ credentials, db }) => {
  if (db.account.accountID === undefined) {
    db.account.accountID = await getAccountID({ credentials })
  }

  progressLogger.write('Checking if root organization present... ')
  const { accountID } = db.account

  const organizationsClient = new OrganizationsClient({ credentials })
  const describeAccountCommand = new DescribeAccountCommand({ AccountId : accountID })
  try {
    await organizationsClient.send(describeAccountCommand)
    progressLogger.write('FOUND\n')
    return
  } catch (e) {
    if (e.name !== 'AWSOrganizationsNotInUseException') {
      throw e
    } // else, there's no organization so we continue on to create one
    progressLogger.write('NOT found\n')
  }

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

export { ensureRootOrganization }
