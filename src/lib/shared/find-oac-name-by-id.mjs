import { ListOriginAccessControlsCommand } from '@aws-sdk/client-cloudfront'

import { progressLogger } from './progress-logger'

const findOACNameByID = async ({ cloudFrontClient, oacID }) => {
  progressLogger?.write(`Determining name for OAC ${oacID}... `)
  let nextMarker
  do {
    const listOACCommand = new ListOriginAccessControlsCommand({
      Marker : nextMarker
    })

    const oacListResponse = await cloudFrontClient.send(listOACCommand)
    const items = oacListResponse.OriginAccessControlList.Items || []

    for (const { Id: id, Name: name } of items) {
      if (id === oacID) {
        progressLogger?.write(`found: ${name}\n`)
        return name
      }
    }

    nextMarker = oacListResponse.OriginAccessControlList.NextMarker
  } while (nextMarker !== undefined)
  progressLogger?.write('NOT found\n')
}

export { findOACNameByID }
