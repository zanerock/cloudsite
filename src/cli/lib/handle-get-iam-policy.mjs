import commandLineArgs from 'command-line-args'
import { Questioner } from 'question-and-answer'

import { cliSpec } from '../constants'
import { generateIAMPolicy } from '../../lib/shared/generate-iam-policy'
import { getOptionsSpec } from './get-options-spec'
import { progressLogger } from '../../lib/shared/progress-logger'

const instructions =
`1. Log into the AWS console.
2. Select/navigate to the IAM service.
3. Select 'Policies' from the left hand menu options.
4. For a new policy, select 'Create policy' and name it 'CloudsiteManager'.
   A. Select the 'JSON' option.
5. For an existing policy, search for 'CloudsiteManager'.
   A. Select 'Edit
6. Copy and paste the above policy into the edit box.
7. Hit 'Next' and then 'Save'.`

const handleGetIAMPolicy = async ({ argv, db, globalOptions }) => {
  const getIAMPolicyOptionsSpec = getOptionsSpec({ cliSpec, name : 'get-iam-policy' })
  const getIAMPolicyOptions = commandLineArgs(getIAMPolicyOptionsSpec, { argv })
  let {
    'with-instructions' : withInstructions,
    'group-name' : groupName
  } = getIAMPolicyOptions

  const groupOptions = Object.keys(db.sso.groups) || []
  if (groupOptions.length === 0) {
    throw new Error('No groups defined in database. Try:\n\ncloudsite import')
  }

  if (groupName === undefined) {
    const interrogationBundle = {
      actions : [
        {
          prompt    : 'Select the group to get the IAM policy for:',
          parameter : 'group-name',
          options   : groupOptions
        }
      ]
    }
    const questioner = new Questioner({ interrogationBundle, output : progressLogger })
    await questioner.question()
    groupName = questioner.get('group-name')
  } else if (!groupOptions.includes(groupName)) {
    throw new Error(`Unknown group '${groupName}'. Is the local database out of date? Try:\n\ncloudsite import`)
  }

  progressLogger.write(JSON.stringify(await generateIAMPolicy({ db, globalOptions, groupName }), null, '  ') + '\n')

  if (withInstructions === true) {
    // As of 2024-03-29, smartIndent does not work with numbered lists, but it should in the future.
    progressLogger.write('\n' + instructions + '\n', { smartIndent : true })
  }
}

export { handleGetIAMPolicy }
