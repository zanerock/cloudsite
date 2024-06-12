import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { cliSpec } from '../../../constants'
import { getOptionsSpec } from '../../../lib/get-options-spec'
import { progressLogger } from '../../../../lib/shared/progress-logger'

const handler = async ({ argv, db, globalOptions }) => {
  const groupCreateOptionsSpec = getOptionsSpec({ cliSpec, path : ['sso', 'groups', 'create'] })
  const groupCreateOptions = commandLineArgs(groupCreateOptionsSpec, { argv })
  let { domains = [], prefix } = groupCreateOptions

  // verify and populate options
  if (prefix === undefined) {
    const interrogationBundle = {
      actions : [
        { prompt : 'What is the group name prefix to use?', parameter : 'prefix' }
      ]
    }
    const questioner = new Questioner({ interrogationBundle, output : progressLogger })
    await questioner.question()
    prefix = questioner.get('prefix')
  }

  if (domains.length === 0) {
    const interrogationBundle = {
      actions : [
        {
          prompt     : 'Which sites should the group be given access to?',
          parameter  : 'domains',
          multiValue : true,
          options    : Object.keys(db.sites)
        }
      ]
    }
    const questioner = new Questioner({ interrogationBundle, output : progressLogger })
    await questioner.question()
    domains = questioner.get('domains')
  } else {
    const unknownDomains = []
    for (const domain of domains) {
      if (!(domain in db.sites)) {
        unknownDomains.push(domain)
      }
    }
    if (unknownDomains.length > 0) {
      throw new Error(`Unknown domain${unknownDomains.length > 1 ? 's' : ''} '${unknownDomains.join("', '")}'; perhaps they are missing from the local database? Try:\n\ncloudsite import`)
    }
  }

  console.log('prefix:', prefix) // DEBUG
  console.log('domains:', domains) // DEBUG

  const groupName = 'CS: ' + prefix + ' content managers'

  return { success : true, userMessage : `Created group '${groupName}'.` }
}

export { handler }
