import { ListHostedZonesCommand } from '@aws-sdk/client-route-53'

const getHostedZoneID = async ({ route53Client, siteInfo }) => {
  let markerToken
  do {
    const listHostedZonesCommand = new ListHostedZonesCommand({ Marker : markerToken })
    const listHostedZonesResponse = await route53Client.send(listHostedZonesCommand)

    for (const { Id, Name } of listHostedZonesResponse.HostedZones) {
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
