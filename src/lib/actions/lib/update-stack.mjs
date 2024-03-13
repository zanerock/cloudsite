import { CloudFormationClient, GetTemplateCommand } from '@aws-sdk/client-cloudformation'
import isEqual from 'lodash/isEqual'

import { SiteTemplate } from '../../shared/site-template'

const updateStack = async ({ credentials, siteInfo }) => {
  const { region, stackName } = siteInfo

  const siteTemplate = new SiteTemplate({ credentials, siteInfo })
  await siteTemplate.loadPlugins()

  const newTemplate = siteTemplate.render()

  const cfClient = new CloudFormationClient({ credentials, region })
  const getTemplateCommand = new GetTemplateCommand({
      StackName: stackName,
      TemplateStage: 'Original'
    })
  const getTemplateResponse = await cfClient.send(getTemplateCommand)
  const currentTemplate = getTemplateResponse.TemplateBody

  if (isEqual(currentTemplate, newTemplate)) {
    process.stdout.write('No change to template; skipping stack update.\n')
    return
  }
}

export { updateStack }