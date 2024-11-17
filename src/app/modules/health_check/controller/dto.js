const joi = require('joi')

const createHealthCheckSchema = joi.object({
  status: joi.boolean().optional(),
  currentVersion: joi.string().required(),
})

const updateHealthCheckSchema = joi.object({
  status: joi.boolean().optional(),
  currentVersion: joi.string().optional(),
})

const dto = { createHealthCheckSchema, updateHealthCheckSchema }
module.exports = dto
