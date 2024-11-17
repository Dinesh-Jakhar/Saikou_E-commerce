const CustomError = require('../error_handler/CustomError')
const ERRORS = require('../error_handler/errors/errors')
const HTTP_ERROR = require('../error_handler/errors/http_errors')

const payloadValidationMiddleware = (schema, validation_type = 'body') => {
  return async (req, _res, next) => {
    try {
      let payload
      switch (validation_type) {
        case 'body':
          payload = await schema.validateAsync(req.body)
          req.body = payload
          break
        case 'query':
          query = await schema.validateAsync(req.query)
          req.query = query
          break
        default:
          throw new CustomError({ ...ERRORS.INVALID_VALIDATION_TYPE })
      }
      next()
    } catch (err) {
      return next(err)
    }
  }
}

module.exports = payloadValidationMiddleware
