import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'

const getPolicyNameFromGroupName = (groupName) => upperFirst(camelCase(groupName)).slice(0, 128)

export { getPolicyNameFromGroupName }
