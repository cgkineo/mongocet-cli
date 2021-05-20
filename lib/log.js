const chalk = require('chalk')

function log ({
  text = '',
  color = '',
  type = 'log'
} = {}) {
  console[type](color ? chalk[color](text) : text)
}

function warn ({
  text = '',
  color = 'red',
  type = 'log'
} = {}) {
  log({ text, color, type })
}

module.exports = {
  warn,
  log
}
