const errorOut = (msg, exitCode = 1) => {
  throw new Error(msg, { exitCode })
}

export { errorOut }
