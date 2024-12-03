const joi = require('joi')

const addToCart = joi.object({
  productId: joi.number().integer().required(),
  quantity: joi.number().integer().positive().required(),
})
const updateProductCount = joi.object({
  productId: joi.number().integer().required(),
  sessionId: joi.string().guid({ version: 'uuidv4' }).required(),
  count: joi.number().integer().required(), //can be negative
})

const dto = { addToCart, updateProductCount }
module.exports = dto
