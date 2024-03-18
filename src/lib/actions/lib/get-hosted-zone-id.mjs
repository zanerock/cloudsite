import { ListHostedZonesCommand } from '@aws-sdk/client-route-53'

const getHostedZoneID = async ({ markerToken, route53Client, siteInfo }) => {
  const { hostedZoneID } = siteInfo
  if (hostedZoneID !== undefined) {
    return hostedZoneID
  }

  const listHostedZonesCommand = new ListHostedZonesCommand({ marker : markerToken })
  const listHostedZonesResponse = await route53Client.send(listHostedZonesCommand)

  for (const { Id, Name } of listHostedZonesResponse.HostedZones) {
    if (Name === siteInfo.apexDomain + '.') {
      siteInfo.hostedZoneID = hostedZoneID
      return Id.replace(/\/[^/]+\/(.+)/, '$1') // /hostedzone/XXX -> XXX
    }
  }

  // TODO: turn this into a loop
  if (listHostedZonesResponse.IsTruncated === true) {
    return await getHostedZoneID({ markerToken : listHostedZonesResponse.NewMarker, route53Client, siteInfo })
  }
}

export { getHostedZoneID }
