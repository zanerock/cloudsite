import { CloudFormationClient, GetTemplateCommand, UpdateStackCommand } from '@aws-sdk/client-cloudformation'
import isEqual from 'lodash/isEqual'

import { checkAdminAuthentication, getCredentials } from '../shared/authentication-lib'
import { getResourceTags } from '../shared/get-resource-tags'
import * as plugins from '../plugins'
import { progressLogger } from '../shared/progress-logger'
import { SiteTemplate } from '../shared/site-template'
import { trackStackStatus } from './lib/track-stack-status'
import { updatePlugins } from './lib/update-plugins'
import { updateSiteInfo } from './lib/update-site-info'

const updateStack = async ({ credentials, db, globalOptions, siteInfo }) => {
  const { region, stackName } = siteInfo

  const siteTemplate = new SiteTemplate({ credentials, siteInfo })
  await siteTemplate.initializeTemplate({ update : true })
  await siteTemplate.loadPlugins({ update : true })

  const newTemplate = siteTemplate.render()

  const cloudFormationClient = new CloudFormationClient({ credentials, region })
  const getTemplateCommand = new GetTemplateCommand({
    StackName     : stackName,
    TemplateStage : 'Original'
  })
  const getTemplateResponse = await cloudFormationClient.send(getTemplateCommand)
  const currentTemplate = getTemplateResponse.TemplateBody

  if (isEqual(currentTemplate, newTemplate)) { // TODO: check if tags changed
    return { success: true, userMessage: 'No change to template; skipping stack update.\n' }
  }
  // else, the template has changed

  const stackUpdateCommand = new UpdateStackCommand({ // UpdateStackInput
    StackName           : stackName,
    TemplateBody        : newTemplate,
    UsePreviousTemplate : false,
    Capabilities        : ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
    DisableRollback     : false,
    Tags                : getResourceTags({ siteInfo })
  })

  await cloudFormationClient.send(stackUpdateCommand)

  const finalStatus = await trackStackStatus({ cloudFormationClient, noDeleteOnFailure : true, stackName })

  await updateSiteInfo({ credentials, siteInfo }) // needed by createOrUpdateDNSRecords

  const postUpdateHandlers = Object.keys(siteInfo.pluginSettings || {}).map((pluginKey) =>
    [pluginKey, plugins[pluginKey].postUpdateHandler]
  )
    .filter(([, postUpdateHandler]) => postUpdateHandler !== undefined)

  if (postUpdateHandlers.length > 0) {
    await Promise.all([
      ...(postUpdateHandlers.map(([pluginKey, handler]) =>
        handler({ settings : siteInfo.pluginSettings[pluginKey], siteInfo })))
    ])
  }

  if (finalStatus === 'UPDATE_COMPLETE') {
    progressLogger.write(`Stack update complete.\n`)
  }

  if (finalStatus === 'UPDATE_COMPLETE') {
    await updatePlugins({ credentials, siteInfo })
  }
}

export { updateStack }
