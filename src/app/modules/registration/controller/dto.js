const joi = require('joi')

const signup = joi.object({
  firstName: joi.string().min(2).max(50).required(),
  lastName: joi.string().optional(),
  email: joi.string().email().required(),
  password: joi.string().min(5).max(31).required(),
})
const login = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
})
const verify = joi.object({
  email: joi.string().email().required(),
})
const resetPass = joi.object({
  email: joi.string().email().required(),
  newPassword: joi.string().required(),
  token: joi.string().required(),
})
const dto = { signup, login, verify, resetPass }
module.exports = dto
