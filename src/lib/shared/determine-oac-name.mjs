import { v4 as uuidv4 } from 'uuid'

import { CloudFrontClient, ListOriginAccessControlsCommand } from '@aws-sdk/client-cloudfront'

import { progressLogger } from './progress-logger'

const determineOACName = async ({ baseName, credentials, siteInfo }) => {
  const { region } = siteInfo
  let currentName = baseName

  // there is on way to get an OAC based on teh name alone, you need the ID (ARN?) which we don't have. So, we have to
  // list the OACs and search for one with the given name
  const allOACNames = await getAllOACNames({ credentials, region })

  while (true) {
    progressLogger?.write(`Checking if OAC name '${currentName}' is free... `)
    if (allOACNames.includes(currentName)) {
      progressLogger?.write('NOT free\n')
      const nameSalt = uuidv4().slice(0, 8)
      currentName = currentName.replace(/-[A-F0-9]{8}$/i, '')
      currentName += '-' + nameSalt
    } else {
      progressLogger?.write('FREE\n')
      return currentName
    }
  }
}

const getAllOACNames = async ({ credentials, region }) => {
  const cloudfrontClient = new CloudFrontClient({ credentials, region })
  let currentMarker
  const result = []
  while (true) {
    const listOACCommand = new ListOriginAccessControlsCommand({
      Marker : currentMarker
    })

    const oacListResponse = await cloudfrontClient.send(listOACCommand)
    const items = oacListResponse.OriginAccessControlList.Items || []

    result.push(...items.map(({ Name : name }) => name))

    currentMarker = oacListResponse.OriginAccessControlList.NextMarker
    if (currentMarker === undefined) {
      return result
    }
  }
}

export { determineOACName }
