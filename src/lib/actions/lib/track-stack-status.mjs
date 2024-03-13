import { DeleteStackCommand, DescribeStacksCommand } from '@aws-sdk/client-cloudformation'

const RECHECK_WAIT_TIME = 2000 // ms

const trackStackStatus = async ({ cloudFormationClient, noDeleteOnFailure, stackName }) => {
  let stackStatus, previousStatus
  do {
    const describeInput = { StackName : stackName }
    const describeCommand = new DescribeStacksCommand(describeInput)
    const describeResponse = await cloudFormationClient.send(describeCommand)

    stackStatus = describeResponse.Stacks[0].StackStatus

    if (stackStatus === 'CREATE_IN_PROGRESS' && previousStatus === undefined) {
      process.stdout.write('Creating stack')
    } else if (stackStatus === 'UPDATE_IN_PROGRESS' && previousStatus === undefined) {
      process.stdout.write('Updating stack')
    } else if (stackStatus === 'ROLLBACK_IN_PROGRESS' && previousStatus !== 'ROLLBACK_IN_PROGRESS') {
      process.stdout.write('\nRollback in progress')
    } else {
      process.stdout.write('.')
    }

    previousStatus = stackStatus
    await new Promise(resolve => setTimeout(resolve, RECHECK_WAIT_TIME))
  } while (stackStatus.endsWith('_IN_PROGRESS'))

  if (stackStatus === 'ROLLBACK_COMPLETE' && noDeleteOnFailure !== true) {
    process.stdout.write(`\nDeleting stack '${stackName}'... `)
    const deleteInput = { StackName : stackName }
    const deleteCommand = new DeleteStackCommand(deleteInput)
    await cloudFormationClient.send(deleteCommand)

    process.stdout.write('done.\n')
  } else {
    process.stdout.write('\nStack status: ' + stackStatus + '\n')
  }

  return stackStatus === 'CREATE_COMPLETE'
}

export { trackStackStatus }
