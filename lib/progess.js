let ticker = 0
let tickerTime = 0
function getTick (animation = [' | ', ' / ', ' - ', ' \\ ']) {
  const elapsed = Date.now() - tickerTime
  if (elapsed < 100) return animation[ticker]
  tickerTime = Date.now()
  ticker = ++ticker >= animation.length ? 0 : ticker
  return animation[ticker]
}

let lastLength = 0
function log ({
  min = 0,
  max = 100,
  value = 0,
  bars = 40,
  marker = '=',
  text = 'Please wait...'
}) {
  const ratio = ((value - min) / (max - min))
  const parts = Math.floor(bars * ratio)
  const dots = marker.repeat(parts)
  const left = bars - parts
  const empty = ' '.repeat(left)
  const output = `[${dots}${empty}] ${parseInt(ratio * 100)}%${getTick()}${text}`
  const padRight = (lastLength - output.length) + 1
  process.stdout.write(`\r${output}${' '.repeat(padRight < 0 ? 1 : padRight)}`)
  lastLength = output.length
}

function clear () {
  const padRight = lastLength + 1
  process.stdout.write(`\r${' '.repeat(padRight < 0 ? 1 : padRight)}`)
  process.stdout.write(`\r`)
}

function end () {
  process.stdout.write(`\n`)
}

module.exports = {
  log,
  clear,
  end
}
