/**
 * Performs the flattening of a data row recursively
 *
 * @param {String} separator Separator to be used as the flattened field name
 * @returns {Object => Object} Flattened object
 */
function flatten ({ objects = true, arrays = false, primitiveArrays = false, separator = '.' } = {}) {
  function step (obj, flatDataRow, currentPath) {
    Object.keys(obj).forEach((key) => {
      const newPath = currentPath ? `${currentPath}${separator}${key}` : key
      const value = obj[key]

      if (objects &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.prototype.toString.call(value.toJSON) !== '[object Function]' &&
        Object.keys(value).length) {
        step(value, flatDataRow, newPath)
        return
      }

      if (!arrays && Array.isArray(value) && primitiveArrays && typeof value[0] !== 'object') {
        step(value, flatDataRow, newPath)
        return
      }

      if (arrays && Array.isArray(value) && (primitiveArrays || (!primitiveArrays && typeof value[0] === 'object'))) {
        step(value, flatDataRow, newPath)
        return
      }

      flatDataRow[newPath] = value
    })

    return flatDataRow
  }

  return dataRow => {
    const flattened = step(dataRow, {})
    return flattened
  }
}

module.exports = flatten
