const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const JSONWrite = require('./JSONWrite')
const { Transform, transforms: { unwind, flatten } } = require('json2csv')
const { warn } = require('./log')
const progress = require('./progess')
const minimatch = require('minimatch')
const fs = require('fs-extra')
const path = require('path')
const ask = require('./ask')
const { DateTime } = require('luxon')

const transformOpts = { highWaterMark: 16384, encoding: 'utf-8' }

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
      flatten({ objects: true, arrays: true }),
      item => {
        if (!csvDateFieldPattern) return item
        return Object.keys(item).reduce((transformed, key) => {
          if (!minimatch.match([key], csvDateFieldPattern).length) return transformed
          const date = new Date(item[key] / 1000)
          const dateString = new DateTime(date).toFormat('yyyy-MM-dd HH:mm:ss')
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
    await new Promise(async resolve => {
      const stream = cursor.pipe(new JSONWrite({
        ndjson: (outputFormat === 'ndjson' || outputFormat === 'csv')
      }))
      stream.on('data', () => progress.log({ max: items, value: index, text: `${collectionNames[index]}` }))
      const filePath = path.join(path.resolve(process.cwd(), outputDir), `${collectionName}.${outputFormat}`)
      try {
        await fs.ensureDir(path.parse(filePath).dir)
      } catch (err) {}
      const json2csv = new Transform(opts, transformOpts)
      const outputStream = (outputFormat === 'csv' ? stream.pipe(json2csv) : stream).pipe(fs.createWriteStream(filePath))
      outputStream.on('finish', resolve)
    })
    progress.end()
  }
  progress.end()
  client.close()
}

module.exports = doExport
