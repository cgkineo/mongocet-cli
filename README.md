# MongoDB collection export tool

Export a glob of collections from a single database in json, ndjson or csv format.

## Installation
`$ npm install -g mongocet-cli`

## Usage
`$ mongocet`

### Collection pattern
`*` is all collections.  
`test_*` is all collections starting with `test_`.  

### CSV date field patterns
`date` is just a `date` field.  
`date*` is all fields starting with `date`.  
`*_date` is all fields ending with `_date`.  

### Configuration with `.mongocetrc.json`
Create a file in your working folder to preconfigure `mongocet`.

```json
{
  "serverUrl": "mongodb://domain:27017/",
  "databaseName": "dbname",
  "collectionsPattern": "*",
  "outputDir": "../export",
  "outputFormat": "csv",
  "csvDateFieldPattern": "date"
}
```
