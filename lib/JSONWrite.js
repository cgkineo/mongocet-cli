const _ = require('lodash')
const stream = require('stream')

/**
 * Steam for processing JSON objects and bufferizing them.
 */
class JSONWrite extends (stream.Transform) {
  /** @ignore */
  constructor ({
    ndjson = false
  } = {}) {
    super({
      writableObjectMode: true
    })
    _.bindAll(this, '_continue')
    this._ndjson = ndjson
    /** @ignore */
    this._readSize = 0
    /** @ignore */
    this._queue = []
    /** @ignore */
    this._buffer = null
    /** @ignore */
    this._next = null
    /** @ignore */
    this._addComma = false
    /** @ignore */
    this._shouldRead = false
    /** @ignore */
    this._isFinished = false
    this.on('drain', this._drain)
  }

  /** @ignore */
  _drain () {
    // if (!this._readableState) return
    // if (this._readableState.pipesCount !== 0) return
  }

  /** @ignore */
  _checkPipes () {
    if (!this._readableState) return
    if (this._readableState.pipesCount !== 0) return
    // make sure to clean up when there are no pipes to write to
    this.destroy()
  }

  /** @ignore */
  _write (chunk, encoding, next) {
    this._next = next
    const divChar = this._ndjson
      ? !this._addComma ? '' : '\n'
      : !this._addComma ? '[' : ','
    this._addToBuffer(divChar + JSON.stringify(chunk))
    this._addComma = true
    if (this._shouldRead) this._send()
    return true
  }

  /** @ignore */
  _addToBuffer (str) {
    if (!this._buffer) {
      this._buffer = Buffer.from(str)
    } else {
      this._buffer = Buffer.concat([this._buffer, Buffer.from(str)])
    }
  }

  /** @ignore */
  _send () {
    const readLength = _.min([this._readSize, this._buffer.length])
    if (readLength !== this._readSize && !this._isFinished) {
      return this._getNext()
    }
    this._shouldRead = false
    const data = this._buffer.slice(0, readLength)
    this._buffer = this._buffer.slice(readLength)
    if (!this._buffer.length) this._buffer = null
    this.push(data)
    this._checkPipes()
  }

  /** @ignore */
  _getNext () {
    const next = this._next
    this._next = null
    if (next) next()
  }

  /** @ignore */
  _read (size) {
    this._readSize = size
    this._shouldRead = true
    this._getNext()
    this._continue()
  }

  /** @ignore */
  _continue () {
    if (this._buffer && this._buffer.length) this._send()
    else if (this._isFinished) return this._finished()
  }

  /** @ignore */
  _flush () {
    /** @ignore */
    this._isFinished = true
    this._ndjson
      ? this._addToBuffer('\n')
      : this._addToBuffer((!this._addComma ? '[' : '') + ']')
    this._send()
  }

  /** @ignore */
  _finished () {
    this.push(null)
  }
}

module.exports = JSONWrite
