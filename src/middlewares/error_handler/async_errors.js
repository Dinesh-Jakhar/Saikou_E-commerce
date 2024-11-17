const CustomError = require('./CustomError')
const { INTERNAL_SERVER_ERROR } = require('../error_handler/errors/http_errors')
const logger = require('../../app/logger/logger')
const asyncErrorHandler = (func) => {
  return (req, res, next) =>
    func(req, res, next).catch((err) => {
      if (err instanceof CustomError) {
        return next(err)
      } else {
        logger.error(err)
        return next(
          new CustomError({
            ...INTERNAL_SERVER_ERROR,
            errors: err.message,
            stack: err.stack,
          })
        )
      }
    })
}

module.exports = asyncErrorHandler
