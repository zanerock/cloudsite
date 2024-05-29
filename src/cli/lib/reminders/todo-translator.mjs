import { ACTION_CLEANUP, ACTION_SETUP_BILLING } from '../../constants'

const todoTranslator = ({ references, todo }) => {
  switch (todo) {
    case ACTION_CLEANUP:
      return `Cleanup partially deleted site '${references}'.`
    case ACTION_SETUP_BILLING:
      return 'Setup billing tags.'
    default:
      throw new Error(`Unrecognized reminder type (todo): '${todo}'`)
  }
}

export { todoTranslator }
