const passport = require('passport')
module.exports = ({ registrationService, logger, CustomError, ERRORS }) => ({
  signup: async (req, res, next) => {
    try {
      const { firstName, lastName, email, password } = req.body
      const ifExists = await registrationService.checkIfExists(email)
      if (ifExists) {
        return res.status(400).json({
          message: 'BAD REQUEST',
          error: 'Email already Exists, Please Login',
        })
      }
      const createdAccount = await registrationService.createAccount(
        firstName,
        lastName,
        email,
        password
      )
      return res.status(201).json({
        message: 'Account created successfully.',
        createdAccount,
      })
    } catch (error) {
      logger.error('Error During Account Creation', error)
      next(error)
    }
  },
  contact_us: async (req, res, next) => {
    try {
      const { name, email, message } = req.body
      await registrationService.send_query(name, email, message)
      return res.status(201).json({
        message: 'Thankyou for contacting us. We will soon reach out to you',
      })
    } catch (error) {
      return next(error)
    }
  },
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body
      const data = await registrationService.loginToAccount(email, password)
      return res.status(200).json({
        message: 'Login Successful',
        token: data,
      })
    } catch (error) {
      return next(error)
    }
  },
  serveResetPasswordPage: async (req, res, next) => {
    try {
      console.log('Hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
      return res.status(200).json({
        message: 'Hiiiiiiiiiii',
      })
    } catch (error) {
      return next(error)
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body
      await registrationService.forgotPassword(email)
      return res.status(200).json({
        message: 'Reset Link has been sent to your Email',
      })
    } catch (error) {
      return next(error)
    }
  },
  resetPassword: async (req, res, next) => {
    try {
      const { email, newPassword, token } = req.body
      const updatePassword = await registrationService.resetPassword(
        email,
        newPassword,
        token
      )
      return res.status(200).json({
        message: 'Password was Successfully Updated',
      })
    } catch (error) {
      return next(error)
    }
  },
  googleAuth: async (req, res, next) => {
    try {
      return passport.authenticate('google', { scope: ['profile', 'email'] })(
        req,
        res,
        next
      )
    } catch (error) {
      throw error
    }
  },
  googleSignIn: async (req, res, next) => {
    try {
      passport.authenticate(
        'google',
        { session: false },
        (err, result, info) => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'Internal Server Error', error: err })
          }

          if (!result || !result.token) {
            return res
              .status(401)
              .json({ message: 'Authentication failed', error: info })
          }
          res.status(200).json({
            message: 'Authentication successful',
            result,
          })
        }
      )(req, res, next)
    } catch (error) {
      throw error
    }
  },
  add_an_address: async (req, res, next) => {
    try {
      const userId = req.user.id
      const {
        name,
        addressLine1,
        addressLine2,
        city,
        districtOrCounty,
        stateOrRegion,
        postalCode,
        countryCode,
        phone,
        address_type,
      } = req.body
      const myAddress = await registrationService.add_an_address(
        userId,
        name,
        addressLine1,
        addressLine2,
        city,
        districtOrCounty,
        stateOrRegion,
        postalCode,
        countryCode,
        phone,
        address_type
      )
      return res.status(201).json({
        message: 'Address created Successfully',
        myAddress,
      })
    } catch (err) {
      return next(err)
    }
  },
  get_all_address: async (req, res, next) => {
    try {
      const userId = req.user.id
      const allAddress = await registrationService.get_All_address(userId)
      return res.status(201).json({
        message: 'Here are your Addresses',
        allAddress,
      })
    } catch (err) {
      return next(err)
    }
  },
  deleteAddress: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { addressId } = req.body
      await registrationService.deleteAddress(userId, addressId)
      return res.status(200).json({
        message: 'Address Deleted Successfully',
        errors: '',
      })
    } catch (err) {
      return next(err)
    }
  },
})
