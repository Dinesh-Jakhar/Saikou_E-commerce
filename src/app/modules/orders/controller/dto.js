const joi = require('joi')

const checkout = joi.object({
  sessionId: joi.string().guid({ version: 'uuidv4' }).required(),
})
const returnOrders = joi.object({
  order_id: joi.string().required(),
  return_reason: joi.string().required(),
})
cancelOrders = joi.object({
  order_id: joi.string().required(),
})
returnsAction = joi.object({
  order_id: joi.string().required(),
  status: joi.string().valid('Approv', 'Reject').required(),
})
info2 = joi.object({
  year1: joi.number().integer().min(2024).required(),
  year2: joi.number().integer().min(2024).required(),
})
const dto = { checkout, returnOrders, cancelOrders, returnsAction, info2 }
module.exports = dto
