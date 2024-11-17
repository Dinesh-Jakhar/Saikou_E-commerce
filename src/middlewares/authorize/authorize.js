const { readerDatabase } = require('../../infra/database/database')
const CustomError = require('../error_handler/CustomError')
const HTTP_ERROR = require('../error_handler/errors/http_errors')

const authorize = (roles = []) => {
  return async (req, res, next) => {
    const user = req.user
    if (!user)
      return next(
        new CustomError({
          ...HTTP_ERROR.FORBIDDEN,
          errors: 'User required for authorization',
        })
      )

    const accountModel = await readerDatabase('Accounts')
    const roleModel = await readerDatabase('Roles')
    const accountRole = (
      await accountModel.findOne({
        attributes: [],
        where: { id: user.id },
        include: {
          model: roleModel,
          attributes: ['role_name'],
        },
      })
    ).toJSON()

    const userRoles = accountRole.Roles.map((role) => role.role_name)
    if (roles.length && !roles.some((role) => userRoles.includes(role))) {
      return next(
        new CustomError({
          ...HTTP_ERROR.FORBIDDEN,
          errors: 'Unauthroized user',
        })
      )
    }
    req.user.role = userRoles
    return next()
  }
}

module.exports = authorize
