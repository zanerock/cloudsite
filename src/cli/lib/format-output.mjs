import yaml from 'js-yaml'
import { jsonToPlainText } from 'json-to-plain-text'

const formatOutput = ({ output, format }) => {
  if (format === 'json') {
    process.stdout.write(JSON.stringify(output, null, '  ') + '\n')
  } else if (format === 'yaml') {
    process.stdout.write(yaml.dump(output))
  } else {
    const options = { color : format !== 'text' }
    const text = jsonToPlainText(output, options)

    process.stdout.write(text + '\n')
  }
}

export { formatOutput }
