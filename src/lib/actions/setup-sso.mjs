import { UpdateInstanceCommand } from '@aws-sdk/client-sso-admin'

import { Questioner } from 'question-and-answer'

import { findIdentityStore, findIdentityStoreStaged } from '../shared/find-identity-store'
import { progressLogger } from '../shared/progress-logger'

const setupSSO = async ({ credentials, db, identityStoreName, identityStoreRegion }) => {
  if (db.sso.details.identityStoreID !== undefined &&
      db.sso.details.identityStoreARN !== undefined &&
      db.sso.details.identityStoreRegion !== undefined &&
      db.sso.details.ssoStartURL !== undefined) {
    progressLogger.write('Found identity store IDs in local database.')
    return { 
      identityStoreARN: db.sso.details.identityStoreARN, 
      identityStoreID: db.sso.details.identityStoreID,
      identityStoreRegion: db.sso.details.identityStoreRegion, 
      ssoStartURL: db.sso.details.ssoStartURL
    }
  }

  let tryCount = 0
  const maxTryCount = 4
  let identityStoreID
  while (identityStoreID === undefined) {
    tryCount += 1

    if (tryCount === maxTryCount) {
      throw new Error('Something appears to be wrong. If the network is unstable or you suspect some other transient error, try again later. You may also look into Cloudsite support options:\n\n<em>https://cloudsitehosting.org/support<rst>')
    }
    const interrogationBundle = { actions : [] }

    const userMessage = tryCount === 1
      ? '\n<warn>It is not currently possible to create an organization linked AWS Identity Center instance programmatically.<rst> Thankfully, creating one manually is easy, just follow the following instructions.'
      : "\n<warn>No Identity Center instance was found.<rst> You may have hit <RETURN> before the Identity Center creation finished, or maybe you didn't hit the 'Enable' button. Try the following URL."
    interrogationBundle.actions.push({ statement : userMessage })
    interrogationBundle.actions.push({
      prompt        : `\n1) Copy the following URL into a browser:\n\n  <code>https://${identityStoreRegion}.console.aws.amazon.com/singlesignon/home?region=${identityStoreRegion}#!/<rst>\n\n2) Hit the 'Enable' button and wait for the 'Dashboard' screen to appear.\n3) Return here and hit <ENTER> to continue the automated setup.`,
      parameter     : 'IGNORE_ME',
      outputOptions : { breakSpacesOnly : true }
    })

    const questioner = new Questioner({
      interrogationBundle,
      output : progressLogger
    })
    await questioner.question()

    const findIdentityStoreResult =
      await findIdentityStore({ credentials, identityStoreRegion })
    if (findIdentityStoreResult.identityStoreID !== undefined) {
      let identityStoreARN, ssoAdminClient, ssoStartURL
      ({
        identityStoreID,
        identityStoreRegion,
        identityStoreARN,
        ssoAdminClient,
        ssoStartURL
      } = findIdentityStoreResult)

      db.sso.details.identityStoreID = identityStoreID
      db.sso.details.identityStoreARN = identityStoreARN
      db.sso.details.identityStoreRegion = identityStoreRegion
      db.sso.details.ssoStartURL = ssoStartURL

      const updateInstanceCommand = new UpdateInstanceCommand({
        Name        : identityStoreName,
        InstanceArn : identityStoreARN
      })
      await ssoAdminClient.send(updateInstanceCommand)

      return { identityStoreID, identityStoreRegion, identityStoreARN, ssoStartURL }
    } // else we loop and try again.

    /* This is what we'd like to do, but AWS inexplicably does not permit you to create a Organization based Instance from the API, even though this is the recommended way to create an instance and the only way that works with permissions and such.

    progressLogger.write(`Creating identity store '${identityStoreName}'...`)

    const createInstanceCommand = new CreateInstanceCommand({ Name : identityStoreName })
    try {
      const createInstanceResults = await ssoAdminClient.send(createInstanceCommand);
      ({ InstanceArn: identityStoreARN } = createInstanceResults)

      const describeInstanceCommand = new DescribeInstanceCommand({ InstanceArn : identityStoreARN })
      const describeInstanceResults = await ssoAdminClient.send(describeInstanceCommand)

      identityStoreID = describeInstanceResults.IdentityStoreId
      identityStoreRegion = identityStoreRegion
      ssoStartURL = 'https://' + describeInstanceResults.Name + '.awsapps.com/start'

      progressLogger.write(' CREATED.\n')
    } catch (e) {
      progressLogger.write(' ERROR.\n')
      throw e
    }
    */
  } // while (identityStoreID === undefined)

  // if we get here, it means we have an identityStoreID, but other identity store data is missing
  const findIdentityStoreResult =
      await findIdentityStoreStaged({ credentials, firstCheckRegion : identityStoreRegion })
  if (findIdentityStoreResult.identityStoreID !== undefined) {
    return findIdentityStoreResult
  } else {
    throw new Error("Your account's Identity Store ID appears to be defined in the local database, but could not be found.")
  }
}

export { setupSSO }
