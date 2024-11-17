const winston = require('winston')
const expressWinston = require('express-winston')
const CustomError = require('../error_handler/CustomError')

module.exports = () => {
  const logger = expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.json()),
    msg: 'HTTP Requests {{req.method}} {{req.path}}',
    requestWhitelist: ['params', 'method', 'path', 'query'],
    responseWhitelist: ['statusCode', 'responseTime'],
  })
  const errorFilter = winston.format((info, opts) => {
    const error = info.meta.error
    if (
      error instanceof CustomError
      //  ||
      // error instanceof ValidationError ||
      // error instanceof JoiValidationError ||
      // error instanceof MulterError
    ) {
      return false
    }
    return true
  })
  const errorLogger = expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      // errorFilter(),
      winston.format.colorize(),
      winston.format.json()
    ),
  })

  return {
    logger,
    errorLogger,
  }
}
