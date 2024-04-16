import commandLineArgs from 'command-line-args'

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

const handleGetIAMPolicy = async ({ argv, db }) => {
  const getIAMPolicyOptionsSpec = getOptionsSpec({ cliSpec, name : 'get-iam-policy' })
  const getIAMPolicyOptions = commandLineArgs(getIAMPolicyOptionsSpec, { argv })
  const withInstructions = getIAMPolicyOptions['with-instructions']

  progressLogger.write(JSON.stringify(await generateIAMPolicy({ db }), null, '  ') + '\n')

  if (withInstructions === true) {
    // As of 2024-03-29, smartIndent does not work with numbered lists, but it should in the future.
    progressLogger.write('\n' + instructions + '\n', { smartIndent : true })
  }
}

export { handleGetIAMPolicy }
