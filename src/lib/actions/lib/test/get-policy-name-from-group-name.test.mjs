import { getPolicyNameFromGroupName } from '../get-policy-name-from-group-name'

describe('getPolicyNameFromGroupName', () => {
  test.each([
    ['Content manager group', 'ContentManagerGroup'],
    ['AReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupName', 'AReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyLongGroupNameAReallyL']
  ])('%s -> %s', (input, expected) => expect(getPolicyNameFromGroupName(input)).toBe(expected))
})