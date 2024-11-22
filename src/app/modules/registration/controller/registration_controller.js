module.exports = ({ registrationService, logger, CustomError, ERRORS }) => ({
  signup: async (req, res, next) => {
    try {
      const { firstName, lastName, email, password } = req.body
      const ifExists = await registrationService.checkIfExists(email)
      if (ifExists) {
        return res.status(400).json({
          message: 'BAD REQUEST',
          error: 'Email already Exists',
        })
      }
      const createdAccount = await registrationService.createAccount(
        firstName,
        lastName,
        email,
        password
      )
      return res.status(201).json({
        message:
          'Account created successfully. Please verify your email by the otp sent on your mail',
        account: createdAccount,
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
  verifyEmail: async (req, res, next) => {
    try {
      const { email, otp } = req.body
      const data = await registrationService.verifyEmail(email, otp)
      return res.status(200).json({
        token: data.token,
        account: data.account,
        message: 'Email verified successfully',
      })
    } catch (error) {
      return next(error)
    }
  },
})
