const constants = require('../../app/constants/constants')
const CustomError = require('../error_handler/CustomError')
const ERRORS = require('../error_handler/errors/errors')
const HTTP_ERROR = require('../error_handler/errors/http_errors')
const jwtHelper = require('./jwt_helper')
const { readerDatabase } = require('../../infra/database/database')
const asyncErrorHandler = require('../../middlewares/error_handler/async_errors')
const logger = require('../../app/logger/logger')

const authenticateJWT = asyncErrorHandler(async (req, res, next) => {
  const token = req.headers.authorization
  if (!token)
    return next(
      new CustomError({ ...HTTP_ERROR.FORBIDDEN, errors: 'token required' })
    )
  const splittedtoken = token.split(' ')
  if (splittedtoken.length !== 2)
    return next(new CustomError(ERRORS.INVALID_TOKEN))
  if (splittedtoken[0] !== constants.TOKEN_TYPE)
    return next(new CustomError(ERRORS.INVALID_TOKEN))
  try {
    const decoded = jwtHelper.verifyToken(splittedtoken[1])
    const decodedKeys = Object.keys(decoded)

    if (decodedKeys.length < 1 || !decodedKeys.includes('id')) {
      throw new CustomError({
        ...HTTP_ERROR.FORBIDDEN,
        errors: 'Invalid token',
      })
    }
    const hubs = await readerDatabase('hubs')
    try {
      const user = (
        await (
          await readerDatabase('Accounts')
        )?.findByPk(decoded.id, {
          include: [
            {
              model: hubs,
              attributes: [
                'id',
                'hub_name',
                'driver_processing_fee',
                'uber_id',
              ], // only to get these value in my details api driver processing fee is required on fe to deduct amount.
            },
          ],
        })
      )?.toJSON()

      if (!user) {
        next(
          new CustomError({
            ...HTTP_ERROR.FORBIDDEN,
            errors: 'User no more exists',
          })
        )
      }
      if (!user.hubs.length) {
        throw new CustomError({
          ...HTTP_ERROR.FORBIDDEN,
          errors: "don't have any hub access",
        })
      }
      user.hubs?.forEach((hub) => {
        delete hub.account_hubs
      })
      req.user = user
      next()
    } catch (err) {
      console.log('Error in hubs >>> ')
      return next(err)
    }
  } catch (err) {
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
