const CustomError = require('../error_handler/CustomError')
const ERRORS = require('../error_handler/errors/errors')
const HTTP_ERROR = require('../error_handler/errors/http_errors')
const jwtHelper = require('./jwt_helper')
const { readerDatabase } = require('../../infra/database/database')
const asyncErrorHandler = require('../../middlewares/error_handler/async_errors')

const authenticateJWT = asyncErrorHandler(async (req, res, next) => {
  const token = req.headers.authorization

  if (!token) {
    return next(
      new CustomError({ ...HTTP_ERROR.FORBIDDEN, errors: 'Token required' })
    )
  }

  const splittedToken = token.split(' ')

  if (splittedToken.length !== 2 || splittedToken[0] !== 'saikou') {
    return next(new CustomError(ERRORS.INVALID_TOKEN))
  }

  try {
    const decoded = jwtHelper.verifyToken(splittedToken[1])
    const decodedKeys = Object.keys(decoded)

    if (decodedKeys.length < 1 || !decodedKeys.includes('id')) {
      throw new CustomError({
        ...HTTP_ERROR.FORBIDDEN,
        errors: 'Invalid token',
      })
    }

    const userModel = await readerDatabase('User')
    const user = await userModel.findByPk(decoded.id)

    if (!user) {
      return next(
        new CustomError({
          ...HTTP_ERROR.FORBIDDEN,
          errors: 'User does not exist',
        })
      )
    }

    // if (!user.emailVerified) {
    //   return next(
    //     new CustomError({
    //       ...HTTP_ERROR.FORBIDDEN,
    //       errors: 'Email not verified',
    //     })
    //   );
    // }

    // Attach user to the request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (err) {
    // Handle JWT errors
    if (err.name === 'TokenExpiredError') {
      return next(new CustomError(ERRORS.TOKEN_EXPIRED))
    } else if (err.name === 'JsonWebTokenError') {
      return next(new CustomError(ERRORS.INVALID_TOKEN))
    } else {
      return next(err)
    }
  }
})

module.exports = authenticateJWT
