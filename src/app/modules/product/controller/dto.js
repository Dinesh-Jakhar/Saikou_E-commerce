const joi = require('joi')

const addProduct = joi.object({
  name: joi.string().required(),
  desc: joi.string().optional().allow(''),
  price: joi.number().positive().required(),
  discountId: joi.number().integer().positive().optional(),
  mainImage: joi.any().optional(),
  descImages: joi.any().optional(),
  unitsInStock: joi.number().integer().min(0).required(),
})

const dto = { addProduct }
module.exports = dto
