const { createController, before } = require('awilix-express')
const payloadValidationMiddleware = require('../../../middlewares/payload_validation/payload_validation')
const dto = require('./controller/dto')
const cart_controller = require('./controller/cart_controller')
const authorize = require('../../../middlewares/authorize/authorize')
const authenticateJWT = require('../../../middlewares/jwt/jwt_authentication')
const { uploadMultipleImages } = require('../../../middlewares/multer/multer')

const cart = createController(cart_controller)
  .prefix('/cart')
  .post('/add', 'addToCart', {
    before: [authenticateJWT, payloadValidationMiddleware(dto.addToCart)],
  })
  .put('/updateProductCount', 'updateProductCount', {
    before: [
      authenticateJWT,
      payloadValidationMiddleware(dto.updateProductCount),
    ],
  })

module.exports = cart
