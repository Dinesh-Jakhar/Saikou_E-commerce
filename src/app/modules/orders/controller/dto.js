const joi = require('joi')

const checkout = joi.object({
  sessionId: joi.string().guid({ version: 'uuidv4' }).required(),
})

const dto = { checkout }
module.exports = dto
