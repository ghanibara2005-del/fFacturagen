export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

// Express 4 does not catch rejected promises in handlers.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
