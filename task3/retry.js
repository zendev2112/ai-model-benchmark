async function withRetry(fn, maxRetries = 3) {
  const baseDelay = 200
  const maxDelay = 8000

  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) throw err

      const calculatedDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
      const jitterRange = calculatedDelay * 0.2
      const jitter = (Math.random() - 0.5) * 2 * jitterRange
      const actualDelay = calculatedDelay + jitter

      await new Promise(resolve => setTimeout(resolve, actualDelay))
    }
  }
}

module.exports = { withRetry }
