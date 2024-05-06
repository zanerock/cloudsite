import {
  CostExplorerClient,
  CreateCostCategoryDefinitionCommand,
  UpdateCostAllocationTagsStatusCommand
} from '@aws-sdk/client-cost-explorer'

import { progressLogger } from '../../shared/progress-logger'
import {
  COST_ALLOCATION_NOT_SET,
  COST_ALLOCATION_TAGS_ACTIVATED,
  COST_ALLOCATION_RULE_DEFINED
} from '../../shared/constants'

const associateCostAllocationTags = async ({ credentials, siteInfo }) => {
  const costExplorerClient = new CostExplorerClient({ credentials })

  progressLogger.write('Examining cost allocation status... ')

  const { apexDomain } = siteInfo
  let { costAllocationStatus } = siteInfo

  if (costAllocationStatus === COST_ALLOCATION_RULE_DEFINED) {
    progressLogger.write(COST_ALLOCATION_RULE_DEFINED + '\n')
  }
  else if (costAllocationStatus === COST_ALLOCATION_NOT_SET || costAllocationStatus === undefined) {
    try {
      progressLogger.write('\n  Activating cost allocation tags...')
      const updateCostAllocationTagsStatusCommand = new UpdateCostAllocationTagsStatusCommand({
        CostAllocationTagsStatus : [{ TagKey: 'function', Status: 'Active' }, { TagKey: 'site', Status: 'Active' }]
      })
      const { Errors: errors } = await costExplorerClient.send(updateCostAllocationTagsStatusCommand)
      if (errors.length > 0) {
        progressLogger.write('PARTIAL success\n')
        const message = errors.reduce((msg, { Code : code, Message: errMsg, TagKey: tagKey }, i) => {
          if (i > 0) {
            msg += '\n'
          }
          msg += `${tagKey}: ${errMsg} (${code})`
          return msg
        }, '')

        throw new Error(msg, { code : 'PARTIAL_SUCCESS'})
      }
      else {
        progressLogger.write('SUCCESS') // we'll do the newline when we do the cost allocation rule belowe
        costAllocationStatus = COST_ALLOCATION_TAGS_ACTIVATED
        siteInfo.costAllocationStatus = COST_ALLOCATION_TAGS_ACTIVATED
      }
    } catch (e) {
      if (e.code !== 'PARTIAL_SUCCESS') {
        progressLogger.write('ERROR\n')
      }
      throw e
    }
  }

  if (costAllocationStatus === COST_ALLOCATION_TAGS_ACTIVATED) {
    progressLogger.write('\n  Creating site cost allocation rule... ')
    const createCostCategoryDefinitionCommand = new CreateCostCategoryDefinitionCommand({
      Name: apexDomain + ' cost allocation',
      RuleVersion : 'CostCategoryExpression.v1',
      Rules: [{
        Type: 'REGULAR',
        Rule: {
          Tags: {
            Key: 'site',
            Values: [apexDomain],
            MatchOptions: 'EQUALS'
          }
        }
      }]
    })

    try {
      const { CostCategoryArn: costCategoryArn } = costExplorerClient.send(createCostCategoryDefinitionCommand)
      siteInfo.costCategoryArn = costCategoryArn
      progressLogger.write('SUCCESS\n')
    }
    catch (e) {
      progressLogger.write('ERROR\n')
      throw (e)
    }
  }
}

const handleAssociateCostAllocationTagsError = ({ e, siteInfo }) => {
  const { apexDomain } = siteInfo

  progressLogger.write('<error>!! ERROR !!<rst>: ' + e.message)

  progressLogger.write(`\nThe attempt to setup your cost allocation tags has failed (refer to the error message above). If this is the first time the tags have been set up, then the issue may be that AWS must 'discover' your tags before they can be activated for cost allocation. This process can take a little time. Wait a little while and try setting up the cost allocation tags again with:\n\n<code>cloudsite update ${apexDomain} --do-billing<rst>\n\n`)
}

export { associateCostAllocationTags, handleAssociateCostAllocationTagsError }
