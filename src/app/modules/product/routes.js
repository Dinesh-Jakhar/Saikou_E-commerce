const { createController, before } = require('awilix-express')
const payloadValidationMiddleware = require('../../../middlewares/payload_validation/payload_validation')
const dto = require('./controller/dto')
const product_controller = require('./controller/product_controller')
const authorize = require('../../../middlewares/authorize/authorize')
const authenticateJWT = require('../../../middlewares/jwt/jwt_authentication')
const { uploadMultipleImages } = require('../../../middlewares/multer/multer')

const product = createController(product_controller)
  .prefix('/product')
  .get('/all', 'allProducts', {
    // before: [authenticateJWT],
  })
  .post('/addNew', 'addNewProduct', {
    before: [
      authenticateJWT,
      authorize('admin'),
      uploadMultipleImages,
      payloadValidationMiddleware(dto.addProduct),
    ],
  })

module.exports = product
