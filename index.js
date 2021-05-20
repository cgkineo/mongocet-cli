const getDefaultConfig = require('./lib/getDefaultConfig')
const ask = require('./lib/ask')
const { log } = require('./lib/log')
const doExport = require('./lib/doExport')

;(async function () {
  const config = await getDefaultConfig({
    serverUrl: 'mongodb://localhost:27017/',
    databaseName: '',
    collectionsPattern: '*',
    outputDir: './',
    outputFormat: 'ndjson',
    csvDateFieldPattern: ''
  })
  log({ text: 'MongoDB collection export tool\n' })
  const isQuiet = process.argv.includes('-q')
  if (!isQuiet) {
    config.serverUrl = await ask({ question: 'Server url', defaultAnswer: config.serverUrl })
    config.databaseName = await ask({ question: 'Database name', defaultAnswer: config.databaseName })
    config.collectionsPattern = await ask({ question: 'Collections pattern', defaultAnswer: config.collectionsPattern })
    config.outputDir = await ask({ question: 'Output path', defaultAnswer: config.outputDir })
    config.outputFormat = await ask({ question: 'Output format (json, ndjson, csv)', defaultAnswer: config.outputFormat })
    if (config.outputFormat === 'csv') {
      config.csvDateFieldPattern = (await ask({ question: 'CSV Date field pattern', defaultAnswer: config.csvDateFieldPattern, required: false }))
    }
  }
  log({ text: 'Exporting...' })
  await doExport(config)
  log({ text: 'Complete.' })
})()
