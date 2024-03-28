import { IAMClient, GetUserCommand } from '@aws-sdk/client-iam'

import { getCredentials } from '../../lib/actions/lib/get-credentials' // move to shared

const checkAuthentication = async ({ db }) => {
  const credentials = getCredentials(db.account.settings)

  const iamClient = new IAMClient({ credentials })
  const getUserCommand = new GetUserCommand({})
  await iamClient.send(getUserCommand) // we don't care about the response, just that it's authenticated
}

export { checkAuthentication }
