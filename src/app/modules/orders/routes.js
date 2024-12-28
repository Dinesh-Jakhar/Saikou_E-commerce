const { createController, before } = require('awilix-express')
const payloadValidationMiddleware = require('../../../middlewares/payload_validation/payload_validation')
const dto = require('./controller/dto')
const order_controller = require('./controller/order_controller')
const authorize = require('../../../middlewares/authorize/authorize')
const authenticateJWT = require('../../../middlewares/jwt/jwt_authentication')
const express = require('express')

const order = createController(order_controller)
  .prefix('/checkout')
  .post('/', 'checkOutTheOrder', {
    before: [authenticateJWT, payloadValidationMiddleware(dto.checkout)],
  })
// .post('/stripe-webhook','myStripeWebhook',{
//   before:[express.raw({ type: 'application/json' })]}
// )

module.exports = order
