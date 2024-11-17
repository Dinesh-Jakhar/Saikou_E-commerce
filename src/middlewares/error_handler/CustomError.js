class CustomError extends Error {
  constructor({ statusCode, message, errors, stack }) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    Error.captureStackTrace(this, this.constructor)
    if (stack) {
      this.stack = stack
    }
  }
}

module.exports = CustomError
