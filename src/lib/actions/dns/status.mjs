import { GetDNSSECCommand, Route53Client } from '@aws-sdk/client-route-53'

import { getHostedZoneID } from '../../shared/get-hosted-zone-id'

const dnsStatus = async ({ credentials, siteInfo }) => {
  const route53Client = new Route53Client({ credentials /* Route 53 is a global service; no region needed */})

  const hostedZoneID = await getHostedZoneID({ route53Client, siteInfo })

  console.log('hostedZoneID:', hostedZoneID) // DEBUG

  const getDNSSECCommand = new GetDNSSECCommand({ HostedZoneId: hostedZoneID })
  const getDNSSECResults = await route53Client.send(getDNSSECCommand)

  return getDNSSECResults
}

export { dnsStatus }