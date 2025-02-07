const joi = require('joi')

const checkout = joi.object({
  sessionId: joi.string().guid({ version: 'uuidv4' }).required(),
})
const returnOrders = joi.object({
  order_id: joi.string().required(),
  return_reason: joi.string().required(),
})
const dto = { checkout, returnOrders }
module.exports = dto
