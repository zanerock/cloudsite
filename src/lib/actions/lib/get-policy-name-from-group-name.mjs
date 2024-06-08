import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'

const getPolicyNameFromGroupName = (groupName) =>
  upperFirst(camelCase(groupName)).replaceAll(/[^a-zA-Z0-9_+=,.@-]/g, '').slice(0, 128)

export { getPolicyNameFromGroupName }
