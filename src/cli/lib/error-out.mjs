const errorOut = (msg, code) => {
  process.stderr.write(msg)
  process.exit(code) // eslint-disable-line no-process-exit
}

export { errorOut }
