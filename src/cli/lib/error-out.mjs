const errorOut = (msg, code = 1) => {
  process.stderr.write(msg)
  process.exit(code) // eslint-disable-line no-process-exit
}

export { errorOut }
