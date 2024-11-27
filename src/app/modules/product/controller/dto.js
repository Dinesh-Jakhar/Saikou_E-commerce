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
const updateProduct = joi.object({
  id: joi.string().guid({ version: 'uuidv4' }).required(),
  name: joi.string().optional(),
  desc: joi.string().optional().allow(''),
  price: joi.number().positive().precision(2).optional(),
  discountId: joi.number().integer().positive().optional(),
  quantity: joi.number().integer().min(0).optional(),
})

const addDiscount = joi.object({
  name: joi.string().required(),
  desc: joi.string().required(),
  discountPercent: joi.number().positive().precision(2).max(100).required(),
})

const dto = { addProduct, addDiscount, updateProduct }
module.exports = dto
