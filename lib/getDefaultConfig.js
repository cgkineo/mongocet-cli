const fs = require('fs-extra')
const findUp = require('find-up')

module.exports = async function getDefaultConfig (defaults) {
  const configPath = await findUp('.mongocetrc.json')
  if (configPath) return Object.assign({}, defaults, fs.readJSONSync(configPath))
  return defaults
}
