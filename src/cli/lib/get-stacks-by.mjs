import { DescribeStacksCommand } from '@aws-sdk/client-cloudformation'

const getStacksBy = async ({ cloudFormationClient, region, testFunc }) => {
  let nextToken
  const results = []
  do {
    const describeStacksCommand = new DescribeStacksCommand({ NextToken : nextToken })
    const describeStacksResults = await cloudFormationClient.send(describeStacksCommand)

    for (const stackData of describeStacksResults.Stacks) {
      if (testFunc(stackData) === true) {
        const data = {
          apexDomain : stackData.Tags.find(({ Key: key }) => key === 'site').Value,
          region,
          stackID    : stackData.StackId,
          StackName  : stackData.StackName
        }

        results.push(data)
      }
    }
    nextToken = describeStacksResults.NextToken
  } while (nextToken !== undefined)

  return results
}

export { getStacksBy }
