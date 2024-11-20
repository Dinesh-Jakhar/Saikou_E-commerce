const registrationService = ({
  registrationRepository,
  CustomError,
  HTTP_ERRORS,
}) => ({
  checkIfExists: async (email) => {
    return await registrationRepository.checkIfExists(email)
  },
  createAccount: async function (firstName, lastName, email) {
    try {
      const account = await registrationRepository.createAccount(
        firstName,
        lastName,
        email
      )
      if (!account) {
        throw new CustomError({
          message: 'Account creation failed',
          code: HTTP_ERRORS.INTERNAL_SERVER_ERROR,
        })
      }
      const { otp, expiresAt } = this.generateOtp()
      account.otp = otp
      account.otpExpiresAt = expiresAt
      await account.save()
      return {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
      }
    } catch (error) {
      throw error
    }
  },
  generateOtp: function () {
    const otp = Math.floor(100000 + Math.random() * 900000)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)
    return { otp, expiresAt }
  },
})

module.exports = registrationService
