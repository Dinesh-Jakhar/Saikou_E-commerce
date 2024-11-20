const joi = require('joi')

const signup = joi.object({
  firstName: joi.string().min(2).max(50).required(),
  lastName: joi.string().optional(),
  email: joi.string().email().required(),
})

const dto = { signup }
module.exports = dto
