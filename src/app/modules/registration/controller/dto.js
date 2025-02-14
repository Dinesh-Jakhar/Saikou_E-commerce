const joi = require('joi')

const deleteAddress = joi.object({
  addressId: joi.string().uuid().required(),
})

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
const contact_us = joi.object({
  name: joi.string().min(2).max(50).required(),
  email: joi.string().email().required(),
  message: joi.string().required(),
})
const addAddress = joi.object({
  name: joi.string().min(2).max(100).required(),
  addressLine1: joi.string().min(5).max(255).required(),
  countryCode: joi.string().length(2).uppercase().required(),
  addressLine2: joi.string().max(255).allow(null, '').optional(),
  city: joi.string().max(100).allow(null, '').optional(),
  districtOrCounty: joi.string().max(100).allow(null, '').optional(),
  stateOrRegion: joi.string().max(100).required(),
  postalCode: joi.string().max(20).required(),
  phone: joi
    .string()
    .pattern(/^\d{10,15}$/)
    .allow(null, '')
    .optional(),
  isDefault: joi.boolean().default(false).optional(),
  address_type: joi
    .string()
    .valid('home', 'office', 'other')
    .default('home')
    .required(),
})

const dto = {
  signup,
  login,
  verify,
  resetPass,
  addAddress,
  deleteAddress,
  contact_us,
}
module.exports = dto
