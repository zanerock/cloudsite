import { CloudFormationClient, CreateStackCommand } from '@aws-sdk/client-cloudformation'

import { associateCostAllocationTags } from './lib/associate-cost-allocation-tags'
import { convertDomainToBucketName } from '../shared/convert-domain-to-bucket-name'
import { createOrUpdateDNSRecords } from './lib/create-or-update-dns-records'
import { determineBucketName } from '../shared/determine-bucket-name'
import { getCredentials } from '../shared/authentication-lib'
import { getResourceTags } from '../shared/get-resource-tags'
import * as plugins from '../plugins'
import { SiteTemplate } from '../shared/site-template'
import { syncSiteContent } from './lib/sync-site-content'
import { trackStackStatus } from './lib/track-stack-status'
import { updateSiteInfo } from './lib/update-site-info'

const STACK_CREATE_TIMEOUT = 30 // min

const create = async ({
  db,
  globalOptions,
  noBuild,
  noDeleteOnFailure,
  siteInfo
}) => {
  let { siteBucketName } = siteInfo

  const credentials = getCredentials(globalOptions)

  siteBucketName = await determineBucketName({ bucketName : siteBucketName, credentials, findName : true, siteInfo })
  siteInfo.siteBucketName = siteBucketName
  const { success, stackName } = await createSiteStack({ credentials, noDeleteOnFailure, siteInfo })

  if (success === true) {
    const postUpdateHandlers = Object.keys(siteInfo.plugins || {}).map((pluginKey) =>
      [pluginKey, plugins[pluginKey].postUpdateHandler]
    )
      .filter(([, postUpdateHandler]) => postUpdateHandler !== undefined)

    await updateSiteInfo({ credentials, siteInfo }) // needed by createOrUpdateDNSRecords

    // TODO: speeds things up, but if one fail, it all fails and is unclear; maybe we should break it up?
    await Promise.all([
      syncSiteContent({ credentials, noBuild, siteInfo }),
      createOrUpdateDNSRecords({ credentials, siteInfo }),
      ...(postUpdateHandlers.map(([pluginKey, handler]) =>
        handler({ pluginData : siteInfo.plugins[pluginKey], siteInfo })))
    ])

    await associateCostAllocationTags({ credentials, db, siteInfo })

    return { success, stackName }
  } else {
    return { success, stackName }
  }
}

const createSiteStack = async ({ credentials, noDeleteOnFailure, siteInfo }) => {
  const { apexDomain, region } = siteInfo

  const siteTemplate = new SiteTemplate({ credentials, siteInfo })
  await siteTemplate.initializeTemplate()
  await siteTemplate.loadPlugins()

  const cloudFormationTemplate = siteTemplate.render()

  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const stackName = siteInfo.stackName || convertDomainToBucketName(apexDomain) + '-stack'
  siteInfo.stackName = stackName // in case it was just created
  const createInput = {
    StackName        : stackName,
    TemplateBody     : cloudFormationTemplate,
    DisableRollback  : false,
    Capabilities     : ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
    TimeoutInMinutes : STACK_CREATE_TIMEOUT,
    Tags             : getResourceTags({ siteInfo })
  }
  const createCommand = new CreateStackCommand(createInput)
  const createResponse = await cloudFormationClient.send(createCommand)

  const { StackId: stackID } = createResponse

  siteInfo.stackName = stackName
  siteInfo.stackID = stackID

  const finalStatus = await trackStackStatus({ cloudFormationClient, noDeleteOnFailure, stackName })
  return { success : finalStatus === 'CREATE_COMPLETE', stackName }
}

export { create }
