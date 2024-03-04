import { Route53Client, ChangeResourceRecordSetsCommand, ListHostedZonesCommand } from '@aws-sdk/client-route-53'
import { CloudFrontClient, GetDistributionCommand } from '@aws-sdk/client-cloudfront'

const createOrUpdateDNSRecords = async ({ credentials, siteInfo }) => {
  const { apexDomain, cloudFrontDistributionID, region } = siteInfo

  const cloudFrontClient = new CloudFrontClient({ credentials, region })
  const getDistributionCommand = new GetDistributionCommand({ Id : cloudFrontDistributionID })
  const distributionResponse = await cloudFrontClient.send(getDistributionCommand)
  const distributionDomainName = distributionResponse.Distribution.DomainName

  const route53Client = new Route53Client({ credentials, region })

  const hostedZoneID = await getHostedZoneID({ route53Client, siteInfo })

  const domains = [apexDomain, 'www.' + apexDomain]

  const changeResourceRecordSetCommand = new ChangeResourceRecordSetsCommand({
    HostedZoneId : hostedZoneID,
    ChangeBatch  : {
      Comment : `Point '${apexDomain}' and 'www.${apexDomain}' to CloudFront distribution.`,
      Changes : domains.map((name) => ({
        Action            : 'UPSERT',
        ResourceRecordSet : {
          Name        : name,
          AliasTarget : {
            DNSName              : distributionDomainName,
            EvaluateTargetHealth : false,
            HostedZoneId         : 'Z2FDTNDATAQYW2' // Static value specified by API for use with CloudFront aliases
          },
          Type : 'A'
        }
      }))
    }
  })
  process.stdout.write(`Creating/updating Route 53 resource record sets/DNS entries for ${domains.join(', ')}...\n`)
  await route53Client.send(changeResourceRecordSetCommand)
}

const getHostedZoneID = async ({ markerToken, route53Client, siteInfo }) => {
  const listHostedZonesCommand = new ListHostedZonesCommand({ marker : markerToken })
  const listHostedZonesResponse = await route53Client.send(listHostedZonesCommand)

  for (const { Id, Name } of listHostedZonesResponse.HostedZones) {
    if (Name === siteInfo.apexDomain + '.') {
      return Id.replace(/\/[^/]+\/(.+)/, '$1') // /hostedzone/XXX -> XXX
    }
  }

  if (listHostedZonesResponse.IsTruncated === true) {
    return await getHostedZoneID({ markerToken : listHostedZonesResponse.NewMarker, route53Client, siteInfo })
  }
}

export { createOrUpdateDNSRecords }
