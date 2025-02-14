const { createController, before } = require('awilix-express')
const registration_controller = require('./controller/registration_controller')
const authenticateJWT = require('../../../middlewares/jwt/jwt_authentication')
const payloadValidationMiddleware = require('../../../middlewares/payload_validation/payload_validation')
const dto = require('./controller/dto')
const passport = require('passport')

const registration = createController(registration_controller)
  .prefix('/user')
  .post('/signup', 'signup', {
    before: [payloadValidationMiddleware(dto.signup)],
  }) //get api for address
  .post('/login', 'login', {
    before: [payloadValidationMiddleware(dto.login)],
  })
  .post('/forgot-password', 'forgotPassword', {
    before: [payloadValidationMiddleware(dto.verify)],
  })
  .post('/reset-password', 'resetPassword', {
    before: [payloadValidationMiddleware(dto.resetPass)],
  })
  .post('/create_address', 'add_an_address', {
    before: [authenticateJWT, payloadValidationMiddleware(dto.addAddress)],
  })
  .get('/reset-password', 'serveResetPasswordPage')
  .get('/get_all_address', 'get_all_address', {
    before: [authenticateJWT],
  })
  .get(
    '/auth/google',
    'googleAuth'
    //   (req, res, next) => {
    //     passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    // }
  )
  .get('/auth/google/callback', 'googleSignIn')
  .post('/delete_address', 'deleteAddress', {
    before: [authenticateJWT, payloadValidationMiddleware(dto.deleteAddress)],
  })
  .post('/contact-us', 'contact_us', {
    before: [payloadValidationMiddleware(dto.contact_us)],
  })
module.exports = registration
