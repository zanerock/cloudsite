import { ListHostedZonesCommand } from '@aws-sdk/client-route-53'

const getHostedZoneID = async ({ route53Client, siteInfo }) => {
  let markerToken
  do {
    const listHostedZonesCommand = new ListHostedZonesCommand({ Marker : markerToken })
    const listHostedZonesResponse = await route53Client.send(listHostedZonesCommand)

    console.log('listHostedZonesResponse:', listHostedZonesResponse) // DEBUG

    for (const { Id, Name } of listHostedZonesResponse.HostedZones) {
      console.log('Id:', Id, 'Name:', Name) // DEBUG
      if (Name === siteInfo.apexDomain + '.') {
        return Id.replace(/\/[^/]+\/(.+)/, '$1') // /hostedzone/XXX -> XXX
      }
    }

    if (listHostedZonesResponse.IsTruncated === true) {
      markerToken = listHostedZonesCommand.NextMarker
    }
  } while (markerToken !== undefined)
}

export { getHostedZoneID }
