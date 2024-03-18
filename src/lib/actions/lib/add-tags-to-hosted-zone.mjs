import { Route53Client, ChangeTagsForResourceCommand } from '@aws-sdk/client-route-53'

import { getHostedZoneID } from './get-hosted-zone-id'
import { getSiteTag } from '../../shared/get-site-tag'

const addTagsToHostedZone = async ({ credentials, siteInfo }) => {
  const siteTag = getSiteTag(siteInfo)
  const route53Client = new Route53Client({ credentials })

  const hostedZoneID = await getHostedZoneID({ route53Client, siteInfo })

  const changeTagsForResourceCommand = new ChangeTagsForResourceCommand({
    ResourceType : 'hostedzone',
    ResourceId   : hostedZoneID,
    AddTags      : [{ Key : siteTag, Value : '' }]
  })
  await route53Client.send(changeTagsForResourceCommand)
}

export { addTagsToHostedZone }
