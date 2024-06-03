import { handler as createUser } from './users/create'
import { create as createSSO} from '../lib/permissions/sso/create'
import { setupGlobalPermissions } from '../../lib/actions/setup-global-permissions'

const handler = async ({ argv, db, globalOpitons }) => {
  const { success : ssoSuccess, userMessage : ssoUserMessage, identityStoreARN, identityStoreRegion, identityStoreID } = 
    await createSSO({ argv, db, globalOpitons })
  if (ssoSuccess !== true) {
    return { success, userMessage }
  }

  await setupGlobalPermissions({ db, globalOptions, identityStoreARN, identityStoreID, identityStoreRegion })

  const { success : userSuccess, userMessage : userUserMessage } = await createUser({ argv, db, globalOpitons })


  if (noDelete === undefined && doDelete === undefined) {
    const interrogationBundle = { actions: [
      {
        prompt    : 'Delete Access keys after SSO setup:',
        paramType : 'boolean',
        default   : true,
        parameter : 'do-delete'
      }
    ]}
    const questioner = new Questioner({ interrogationBundle, output: progressLogger })
    await questioner.question()

    doDelete = questioner.get(',do-delete')
  }



  if (noDelete === true) {
    doDelete = false
  } else if (doDelete === undefined) {
    doDelete = false
  }

  if (doDelete === true) {
    progressLogger.write('Checking Access Keys...')

    let marker
    let accessKeyID = false
    let activeCount = 0
    do {
      const listAccessKeysCommand = new ListAccessKeysCommand({
        Marker : marker
      })
      const listAccessKeysResult = await iamClient.send(listAccessKeysCommand)
      for (const { AccessKeyId: testKeyID, Status: status } of listAccessKeysResult.AccessKeyMetadata) {
        if (status === 'Active') {
          accessKeyID = activeCount === 0 && testKeyID
          activeCount += 1
        }
      }

      marker = listAccessKeysResult.Marker
    } while (accessKeyID === undefined && marker !== undefined)

    if (accessKeyID === false && activeCount > 1) {
      progressLogger.write(' MULTIPLE keys found.\nSkipping Access Key deletion.')
    } else if (accessKeyID === false) {
      progressLogger.write(' NO KEYS FOUND.\n')
    } else {
      progressLogger.write(' DELETING...')
      const deleteAccessKeyCommand = new DeleteAccessKeyCommand({ AccessKeyId : accessKeyID })

      try {
        await iamClient.send(deleteAccessKeyCommand)
        progressLogger.write('  DONE.\n')
      } catch (e) {
        progressLogger.write('  ERROR.\n')
        throw e
      }
    }
  } else {
    progressLogger.write('Leaving Access Keys in place.\n')
  }
}

export { handler }