const { createController, before } = require('awilix-express')
const registration_controller = require('./controller/registration_controller')
const payloadValidationMiddleware = require('../../../middlewares/payload_validation/payload_validation')
const dto = require('./controller/dto')

const registration = createController(registration_controller)
  .prefix('/user')
  .post('/signup', 'signup', {
    before: [payloadValidationMiddleware(dto.signup)],
  })
  .post('/login', 'login', {
    before: [payloadValidationMiddleware(dto.login)],
  })
  .post('/forgot-password', 'forgotPassword', {
    before: [payloadValidationMiddleware(dto.verify)],
  })
  .post('/reset-password', 'resetPassword', {
    before: [payloadValidationMiddleware(dto.resetPass)],
  })

module.exports = registration
