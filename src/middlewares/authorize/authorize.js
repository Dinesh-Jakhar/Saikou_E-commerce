const { readerDatabase } = require('../../infra/database/database')
const CustomError = require('../error_handler/CustomError')
const HTTP_ERROR = require('../error_handler/errors/http_errors')

const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      const user = req.user

      if (!user) {
        return next(
          new CustomError({
            ...HTTP_ERROR.FORBIDDEN,
            errors: 'User required for authorization',
          })
        )
      }

      const accountModel = await readerDatabase('User')
      const account = await accountModel.findOne({
        attributes: ['id', 'role', 'emailVerified'],
        where: { id: user.id },
      })

      if (!account) {
        return next(
          new CustomError({
            ...HTTP_ERROR.FORBIDDEN,
            errors: 'User not found',
          })
        )
      }

      const userRole = account.role

      if (roles.length && !roles.includes(userRole)) {
        return next(
          new CustomError({
            ...HTTP_ERROR.FORBIDDEN,
            errors: 'Unauthorized user',
          })
        )
      }

      req.user.id = account.id
      req.user.role = userRole
      req.user.isVerified = account.emailVerified
      next()
    } catch (error) {
      console.error(error)
      return next(
        new CustomError({
          ...HTTP_ERROR.INTERNAL_SERVER_ERROR,
          errors: 'Authorization failed',
        })
      )
    }
  }
}

module.exports = authorize
