const { ValidationError } = require('sequelize')
const JoiValidationError = require('joi').ValidationError
const CustomError = require('./CustomError')
const logger = require('../../../src/app/logger/logger.js')
const HTTP_ERROR = require('./errors/http_errors.js')
const ERRORS = require('./errors/errors.js')
const { MulterError } = require('multer')
const config = require('../../app/config/config.js')

const error_handler = (err, _req, res, _next) => {
  if (err instanceof JoiValidationError) {
    const joiErrors = err.details.map((obj) => obj.message).join(', ')
    const { statusCode, message } = ERRORS.VALIDATION_ERROR
    return res
      .status(statusCode)
      .json(error_response(statusCode, message, joiErrors, err.stack))
  }
  if (err instanceof ValidationError) {
    const errors = err.errors.reduce((ac, cv, idx) => {
      if (idx === 0) {
        return cv.message
      }
      return `${ac}, ${cv.message}`
    }, '')
    const { statusCode, message } = ERRORS.VALIDATION_ERROR
    return res
      .status(statusCode)
      .send(error_response(statusCode, message, errors))
  }
  if (err instanceof MulterError) {
    const multerMessage = err.message
    const { statusCode, errors, message } = HTTP_ERROR.BAD_REQUEST
    if (/Unexpected field/.test(multerMessage)) {
      const field = err.field
      const errorMessage = `\`${field}\` ${multerMessage}`
      return res
        .status(statusCode)
        .send(error_response(statusCode, message, errorMessage, err.stack))
    }

    return res
      .status(statusCode)
      .send(error_response(statusCode, message, errors, err.stack))
  }
  if (err instanceof Error) {
    if (err instanceof CustomError) {
      return res
        .status(err.statusCode)
        .send(
          error_response(err.statusCode, err.message, err.errors, err.stack)
        )
    }
    logger.error(err)
    const { statusCode, errors, message } = HTTP_ERROR.INTERNAL_SERVER_ERROR
    return res
      .status(statusCode)
      .send(error_response(statusCode, message, errors, err.stack))
  }

  logger.error(err)
  const { statusCode, errors, message } = HTTP_ERROR.INTERNAL_SERVER_ERROR
  return res
    .status(statusCode)
    .send(error_response(statusCode, message, errors, err.stack))
}

module.exports = error_handler

/**
 *
 * @param {number | string} statusCode
 * @param {string} message
 * @param {string} errors
 * @returns
 */
const error_response = (statusCode, message, errors, stack = null) => {
  const output = {
    status: statusCode?.toString()?.startsWith('2') ? 'success' : 'error',
    message: message,
    error: errors,
  }

  if (config.ENV === 'development' || config.ENV === 'qa') {
    output.stack = stack
  }

  return output
}
