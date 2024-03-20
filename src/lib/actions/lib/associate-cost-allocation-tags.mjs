import { CostExplorerClient, UpdateCostAllocationTagsStatusCommand } from '@aws-sdk/client-cost-explorer'

const associateCostAllocationTags = async ({ credentials, tag }) => {
  const costExplorerClient = new CostExplorerClient({ credentials })
  const updateCostAllocationTagsStatusCommand = new UpdateCostAllocationTagsStatusCommand({
    CostAllocationTagsStatus : [{ TagKey : tag, Status : 'Active' }]
  })
  await costExplorerClient.send(updateCostAllocationTagsStatusCommand)
}

const handleAssociateCostAllocationTagsError = ({ e, siteInfo }) => {
  const { apexDomain } = siteInfo
  // console.log(JSON.stringify(e)) // DEBUG

  process.stdout.write(`\nThe attempt to setup your cost allocation tags has failed. This is expected as AWS must 'discover' your tags before they can be activated for cost allocation. Wait a little while and try setting up the cost allocation tags again with:\n\ncloudsite update ${apexDomain} --do-billing\n\n`)
}

export { associateCostAllocationTags, handleAssociateCostAllocationTagsError }
