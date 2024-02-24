import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

const handleConfigurationShow = async () => {
  const configPath = fsPath.join(process.env.HOME, '.config', 'cloudsite', 'global-options.json')
  const configContents = await fs.readFile(configPath, { encoding : 'utf8' })
  process.stdout.write(configContents)
}

export { handleConfigurationShow }
