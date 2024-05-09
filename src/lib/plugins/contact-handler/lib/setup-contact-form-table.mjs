import { getResourceTags } from '../../../shared/get-resource-tags'

const setupContactFormTable = ({ siteInfo, siteTemplate }) => {
  const { finalTemplate, resourceTypes } = siteTemplate
  const { apexDomain } = siteInfo

  const tags = getResourceTags({ funcDesc : 'store contact info', siteInfo })

  finalTemplate.Resources.ContactHandlerDynamoDB = {
    Type       : 'AWS::DynamoDB::Table',
    Properties : {
      TableName            : apexDomain + '-ContactFormEntries',
      AttributeDefinitions : [
        { AttributeName : 'SubmissionID', AttributeType : 'S' },
        { AttributeName : 'SubmissionTime', AttributeType : 'S' }
      ],
      KeySchema : [
        { AttributeName : 'SubmissionID', KeyType : 'HASH' },
        { AttributeName : 'SubmissionTime', KeyType : 'RANGE' }
      ],
      BillingMode : 'PAY_PER_REQUEST',
      Tags        : tags
    }
  }

  finalTemplate.Outputs.ContactHandlerDynamoDB = { Value : { Ref : 'ContactHandlerDynamoDB' } }
  resourceTypes['DynamoDB::Table'] = true
}

export { setupContactFormTable }
