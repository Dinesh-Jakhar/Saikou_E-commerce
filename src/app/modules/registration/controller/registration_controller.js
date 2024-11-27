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
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body
      const data = await registrationService.forgotPassword(email)
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
})
