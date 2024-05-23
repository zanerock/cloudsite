import yaml from 'js-yaml'

import { ACMClient } from '@aws-sdk/client-acm'
import { CloudFormationClient, DescribeStacksCommand, GetTemplateCommand } from '@aws-sdk/client-cloudformation'
import { IAMClient } from '@aws-sdk/client-iam'
import { IdentitystoreClient } from '@aws-sdk/client-identitystore'

import { getAccountID } from '../shared/get-account-id'
import { getCredentials } from './lib/get-credentials'
import { findBucketByTags } from '../shared/find-bucket-by-tags'
import { findCertificate } from './lib/find-certificate'
import { findIdentityStoreStaged } from '../shared/find-identity-store'
import * as plugins from '../plugins'
import { progressLogger } from '../shared/progress-logger'
import { searchGroups } from './lib/search-groups'
import { searchPermissionSets } from './lib/search-permission-sets'
import { searchPolicies } from './lib/search-policies'

const doImport =
  async ({ commonLogsBucket, db, domain, groupName, policyName, region, sourcePath, sourceType, stack }) => {
    const siteInfo = { apexDomain : domain, stackName : stack, region, sourcePath, sourceType }
    const credentials = getCredentials(db.account.localSettings)

    const acmClient = new ACMClient({ credentials, region : 'us-east-1' }) // certificates are always in us-east-1
    const { certificateArn } = await findCertificate({ apexDomain : domain, acmClient })
    siteInfo.certificateArn = certificateArn

    const accountID = await getAccountID({ credentials })
    db.account.accountID = accountID

    progressLogger?.write(`Examining stack '${stack}' outputs...\n`)
    const cloudFormationClient = new CloudFormationClient({ credentials, region })
    const describeStacksCommand = new DescribeStacksCommand({ StackName : stack })
    const stacksInfo = await cloudFormationClient.send(describeStacksCommand)

    const getTemplateCommand = new GetTemplateCommand({ StackName : stack })
    const templateBody = (await cloudFormationClient.send(getTemplateCommand)).TemplateBody
    const template = yaml.load(templateBody)

    siteInfo.oacName = template.Resources.SiteCloudFrontOriginAccessControl.Properties.OriginAccessControlConfig.Name

    const stackOutputs = stacksInfo.Stacks[0].Outputs || []
    for (const { OutputKey: key, OutputValue: value } of stackOutputs) {
      if (key === 'SiteS3Bucket') {
        siteInfo.siteBucketName = value

        if (commonLogsBucket === undefined) {
          commonLogsBucket = await findBucketByTags({
            credentials,
            description : 'common logs',
            tags        : [
              { key : 'site', value : domain },
              { key : 'function', value : 'common logs storage' }
            ]
          })
        }
        if (commonLogsBucket !== undefined && commonLogsBucket !== 'NONE') {
          siteInfo.commonLogsBucket = commonLogsBucket
        }
      } else if (key === 'SiteCloudFrontDistribution') {
        siteInfo.cloudFrontDistributionID = value
      }
    } // for (... of stackOutputs)

    progressLogger?.write('Loading plugins data...\n')

    const pluginsData = {}
    siteInfo.plugins = pluginsData

    for (const pluginName of Object.keys(plugins)) {
      progressLogger?.write(`Importing plugin settings for '${pluginName}'...\n`)
      const { importHandler } = plugins[pluginName]
      if (importHandler === undefined) {
        throw new Error(`Plugin '${pluginName}' does not define 'importHandler'; cannot  continue with import.`)
      }

      await importHandler({ credentials, name : pluginName, pluginsData, siteInfo, template })
    }

    await importAccountData({ credentials, db, groupName, policyName })

    return siteInfo
  }

const importAccountData = async ({ credentials, db, groupName, policyName }) => {
  const { identityStoreRegion, ssoAdminClient } = await importIdentityStoreData({ credentials, db })
  const iamClient = new IAMClient({ credentials })

  Promise.all([
    await importGroupData({ credentials, db, groupName, identityStoreRegion }),
    await importPermissionSet({ db, policyName, ssoAdminClient }),
    await importPolicyData({ db, iamClient, policyName })
  ])
}

const importGroupData = async ({ credentials, db, groupName, identityStoreRegion }) => {
  if (groupName !== undefined && (db.account.groupName !== groupName || db.account.groupID === undefined)) {
    db.account.groupName = groupName
    const identityStoreClient = new IdentitystoreClient({ credentials, region : identityStoreRegion })
    const groupID = searchGroups({ groupName : db.account.groupName, identityStoreClient, identityStoreRegion })
    db.account.groupID = groupID
  } else if (db.account.groupName === undefined || db.account.groupID === undefined) {
    throw new Error('No group name and/or ID defined in local DB; must provide group name to resolve.')
  }
}

const importIdentityStoreData = ({ credentials, db }) => {
  const { id, instanceARN, region, ssoAdminClient, ssoStartURL } = findIdentityStoreStaged({ credentials })
  db.account.identityStoreID = id
  db.account.identityStoreARN = instanceARN
  db.account.identityStoreRegion = region
  db.account.ssoStartURL = ssoStartURL

  return { identityStoreRegion : region, ssoAdminClient }
}

const importPermissionSet = async ({ db, policyName, ssoAdminClient }) => {
  const permissionSetARN = searchPermissionSets({ db, policyName, ssoAdminClient })
  db.account.permissionSetARN = permissionSetARN
}

const importPolicyData = async ({ db, iamClient, policyName }) => {
  if (policyName !== undefined) {
    const policyARN = searchPolicies({ policyName : db.account.policyName, iamClient })
    db.account.policyName = policyName
    db.account.policyARN = policyARN
  } else if (db.account.policyName === undefined || db.account.policyID === undefined) {
    throw new Error('No policy name and/or ARN defined in local DB; must provide policy name to resolve.')
  }
}

export { doImport }
