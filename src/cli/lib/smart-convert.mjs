const smartConvert = (value) => {
  if (value === undefined) {
    return ''
  } else if (value === 'true' || value === 'TRUE') {
    return true
  } else if (value === 'false' || value === 'FALSE') {
    return false
  } else if (value.match(/^\s*\d+\s*$/)) {
    return parseInt(value)
  } else if (value.match(/^\s*(?:\d+(?:\.\d+)|\.\d+)\s*$/)) {
    return parseFloat(value)
  } else {
    value = value.trim()
    if (value.startsWith('\\')) {
      return value.slice(1)
    } else {
      return value
    }
  }
}

export { smartConvert }
