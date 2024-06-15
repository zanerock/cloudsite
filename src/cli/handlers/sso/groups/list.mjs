import pick from 'lodash/pick'

const handler = ({ db }) => {
  const data = {}

  for (const [key, value] of Object.entries(db.sso.groups)) {
    data[key] = pick(value, 'domains')
  }

  return { data, success: true }
}

export { handler }