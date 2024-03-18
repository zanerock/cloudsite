import { CostExplorerClient, UpdateCostAllocationTagsStatusCommand } from '@aws-sdk/client-cost-explorer'

const associateCostAllocationTags = async ({ credentials, tag }) => {
  const costExplorerClient = new CostExplorerClient({ credentials })
  const updateCostAllocationTagsStatusCommand = new UpdateCostAllocationTagsStatusCommand({
    CostAllocationTagsStatus : [{ TagKey : tag, Status : 'Active' }]
  })
  await costExplorerClient.send(updateCostAllocationTagsStatusCommand)
}

export { associateCostAllocationTags }
