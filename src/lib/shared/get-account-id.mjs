import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

import { progressLogger } from './progress-logger'

const getAccountID = async ({ credentials }) => {
  progressLogger?.write('Getting effective account ID...\n')
  const response = await new STSClient({ credentials }).send(new GetCallerIdentityCommand({}))
  const accountID = response.Account

  return accountID
}

export { getAccountID }
