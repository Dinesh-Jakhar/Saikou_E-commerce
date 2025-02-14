const { createController, before } = require('awilix-express')
const payloadValidationMiddleware = require('../../../middlewares/payload_validation/payload_validation')
const dto = require('./controller/dto')
const order_controller = require('./controller/order_controller')
const authorize = require('../../../middlewares/authorize/authorize')
const authenticateJWT = require('../../../middlewares/jwt/jwt_authentication')

const order = createController(order_controller)
  .prefix('/')
  .post('checkout', 'checkOutTheOrder', {
    before: [
      authenticateJWT,
      // , payloadValidationMiddleware(dto.checkout)
    ],
  })
  .get('allOrders', 'getAllOrders', {
    before: [authenticateJWT, authorize('admin')],
  })
  //.post('/stripe-webhook','myStripeWebhook',{
  //   before:[express.raw({ type: 'application/json' })]}
  // )
  .get('getOrder', 'getMyOrders', {
    before: [authenticateJWT],
  })
  .post('return-order', 'returnOrder', {
    before: [authenticateJWT, payloadValidationMiddleware(dto.returnOrders)],
  })
  .post('cancelOrder', 'cancelOrder', {
    before: [
      authenticateJWT,
      authorize('admin'),
      payloadValidationMiddleware(dto.cancelOrders),
    ],
  })
  .get('admin/info-1', 'adminInfo_1', {
    before: [authenticateJWT, authorize('admin')],
  })
  .post('admin/info-2', 'adminInfo_2', {
    before: [
      authenticateJWT,
      authorize('admin'),
      payloadValidationMiddleware(dto.info2),
    ],
  })
  .post('admin/action-on-returns', 'actions_on_returns', {
    before: [
      authenticateJWT,
      authorize('admin'),
      payloadValidationMiddleware(dto.returnsAction),
    ],
  })
module.exports = order
