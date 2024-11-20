module.exports = ({ registrationService, logger, CustomError, ERRORS }) => ({
  signup: async (req, res, next) => {
    try {
      const { firstName, lastName, email } = req.body
      const ifExists = await registrationService.checkIfExists(email)
      if (ifExists) {
        throw new CustomError({
          errors: ERRORS.EMAIL_ALREADY_TAKEN,
        })
      }
      const createdAccount = await registrationService.createAccount(
        firstName,
        lastName,
        email
      )
      return res.status(201).json({
        message:
          'Account created successfully. Please verify your email by the otp sent on your mail (Validity 10min)',
        account: createdAccount,
      })
    } catch (error) {
      logger.error('Error During Account Creation', error)
      next(error)
    }
  },
})
