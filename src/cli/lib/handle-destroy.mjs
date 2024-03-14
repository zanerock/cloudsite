import commandLineArgs from 'command-line-args'

import { cliSpec } from '../constants'
import { destroy } from '../../lib/actions/destroy'
import { getSiteInfo } from './get-site-info'

const handleDestroy = async ({ argv, globalOptions, sitesInfo }) => {
  const destroyOptionsSpec = cliSpec.commands.find(({ name }) => name === 'destroy').arguments
  const destroyOptions = commandLineArgs(destroyOptionsSpec, { argv })
  const apexDomain = destroyOptions['apex-domain']
  const { confirmed } = destroyOptions

  const siteInfo = getSiteInfo({ apexDomain, sitesInfo })

  if (confirmed !== true) {
    process.stderr.write("Interactive mode not yet implement. You must include the '--confirmed' option.\n")
    process.exit(3) // eslint-disable-line no-process-exit
  }

  const finalStatus = await destroy({ globalOptions, progressLogger: process.stdout, siteInfo })

  if (finalStatus === 'DELETE_FAILED') {
    if ('contactHandler' in siteInfo.pluginSettings) {
      process.stdout.write("Stack deletion failed. If this is the first time the stack has been deleted, this can be caused by distributed lambda functions in the 'contactHandler' plugin. These can take a little while to clear and they will block the stack deletion until AWS removes them. Try again in 15-30 min. If the problem persists, refer to the AWS console CloudFormation service. Select the stack and check the 'Events' tab for more information.")
    }
    else {
      process.stdout.write("Stack deletion failed for unknown reasons. It may be due to lingering resources that cannot be deleted immediately. Try again in 15-30 min or refer to the AWS console CloudFormation service. Select the stack and check the 'Events' tab for more information.")
    }
  }
  else {
    process.stdout.write('Final stack status: ' + finalStatus)
  }
}

export { handleDestroy }
