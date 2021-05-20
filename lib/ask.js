const prompt = require('prompt')
const chalk = require('chalk')

module.exports = function ask ({
  question = '',
  pattern = /.*/,
  invalid = 'Invalid',
  defaultAnswer = '',
  secret = false,
  color = '',
  required = true
} = {}) {
  const schema = {
    name: 'answer',
    description: color ? chalk[color](question) : question,
    type: 'string',
    pattern,
    message: invalid,
    hidden: secret,
    replace: secret ? '*' : '',
    default: defaultAnswer,
    required,
    before: function (value) { return value }
  }
  return new Promise((resolve, reject) => {
    prompt.message = ''
    prompt.delimiter = ''
    prompt.start()
    prompt.get(schema, function (err, confirmation) {
      if (err) return reject(err)
      resolve(confirmation.answer)
    })
  })
}
