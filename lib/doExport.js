const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const JSONWrite = require('./JSONWrite')
const { Parser } = require('json2csv')
const { warn } = require('./log')
const progress = require('./progress')
const minimatch = require('minimatch')
const fs = require('fs-extra')
const path = require('path')
const ask = require('./ask')
const { DateTime } = require('luxon')
const flatten = require('./flatten')
const unwind = require('./unwind')

async function doExport ({
  serverUrl = '',
  databaseName = '',
  collectionsPattern = '',
  outputDir = '',
  outputFormat = '',
  csvDateFieldPattern = ''
} = {}) {
  const opts = {
    transforms: [
      unwind({ primitiveArrays: false }),
      flatten({ objects: true, primitiveArrays: false }),
      flatten({ objects: false, primitiveArrays: true }),
      item => {
        if (!csvDateFieldPattern) return item
        return Object.keys(item).reduce((transformed, key) => {
          if (!minimatch.match([key], csvDateFieldPattern).length) return transformed
          let date = new Date(parseInt(item[key]) / 1000)
          if (date.getFullYear() === 1970) date = new Date(parseInt(item[key]))
          const dateString = DateTime.fromJSDate(date).toFormat('yyyy-MM-dd HH:mm:ss')
          return { ...transformed, [key]: dateString }
        }, item)
      }
    ]
  }
  const client = await MongoClient.connect(`${serverUrl}/${databaseName}/`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const database = client.db(databaseName)
  const allCollectionNames = (await database.collections()).map(col => col.collectionName)
  const collectionNames = minimatch.match(allCollectionNames, collectionsPattern)
  if (!collectionNames || !collectionNames.length) {
    client.close()
    warn({ text: 'No matching collections found.' })
    return
  }
  const items = collectionNames.length
  const shouldExport = /y/i.test(await ask({
    question: `Export ${items} collection${items > 1 ? 's' : ''}? (y/n)`,
    defaultAnswer: 'n'
  }))
  if (!shouldExport) {
    client.close()
    return
  }
  for (let index = 0; index < items; index++) {
    const collectionName = collectionNames[index]
    const collection = await database.collection(collectionName)
    const cursor = collection.find({})
    const count = await cursor.count()
    const filePath = path.join(path.resolve(process.cwd(), outputDir), `${collectionName}.${outputFormat}`)
    // eslint-disable-next-line no-async-promise-executor
    await new Promise(resolve => {
      const stream = cursor.pipe(new JSONWrite({
        ndjson: (outputFormat === 'ndjson' || outputFormat === 'csv')
      }))
      let position = 0
      stream.on('data', () => {
        position++
        progress.log({ max: items, value: index + (position / (count || 1)), text: `${collectionNames[index]}` })
      })
      try {
        fs.ensureDirSync(path.parse(filePath).dir)
      } catch (err) {}
      const fileStream = fs.createWriteStream(filePath)
      const outputStream = stream.pipe(fileStream)
      outputStream.on('finish', async () => {
        await fileStream.close()
        resolve()
      })
      outputStream.on('error', async () => {
        await fileStream.close()
        resolve()
      })
    })
    if (outputFormat === 'csv') {
      const input = (await fs.readFile(filePath)).toString().split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .map(line => JSON.parse(line))
      const output = new Parser(opts).parse(input)
      await fs.writeFile(filePath, output)
    }
    progress.end()
  }
  progress.end()
  client.close()
}

module.exports = doExport
