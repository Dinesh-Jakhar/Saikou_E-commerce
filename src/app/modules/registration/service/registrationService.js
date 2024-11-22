const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const registrationService = ({
  registrationRepository,
  CustomError,
  emailService,
  HTTP_ERRORS,
  ERRORS,
  configs,
}) => ({
  checkIfExists: async (email) => {
    return await registrationRepository.checkIfExists(email)
  },
  createAccount: async function (firstName, lastName, email, password) {
    try {
      //encode the password
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      const account = await registrationRepository.createAccount(
        firstName,
        lastName,
        email,
        hashedPassword
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
      await account.save() //send the otp
      const title = 'Verify Your Email'
      const body = `The Otp is valid for 10min: ${otp}`
      await emailService.mailSender(email, title, body)
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
  loginToAccount: async function (email, password) {
    try {
      const account = await registrationRepository.checkIfExists(email)
      if (!account) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Email doesnot exists',
        })
      }
      const isPasswordValid = await bcrypt.compare(password, account.password)
      if (!isPasswordValid) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Incorrect Password',
        })
      }
      if (!account.emailVerified) {
        const { otp, expiresAt } = this.generateOtp()
        account.otp = otp
        account.otpExpiresAt = expiresAt
        await account.save() //send the otp
        const title = 'Verify Your Email'
        const body = `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
        await emailService.mailSender(email, title, body)
        throw new CustomError({
          ...ERRORS.EMAIL_NOT_VERIFIED,
          errors: 'OTP has been sent on your email. Please verify your email',
        })
      }
      const token = jwt.sign(
        {
          id: account.id,
          email: account.email,
          role: account.role,
        },
        configs.JWT_SECRET,
        {
          expiresIn: '4h',
        }
      )
      return {
        token: token,
        account: {
          id: account.id,
          email: account.email,
          role: account.role,
        },
      }
    } catch (error) {
      throw error
    }
  },
  verifyEmail: async (email, otp) => {
    try {
      const account = await registrationRepository.checkIfExists(email)
      if (!account) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Email doesnot exists',
        })
      }
      if (otp !== account.otp) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Invalid OTP',
        })
      }
      const currentDate = Date.now()
      if (currentDate > account.otpExpiresAt) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'OTP expired',
        })
      }

      account.emailVerified = true
      account.otp = null
      account.otpExpiresAt = null
      await account.save()

      const token = jwt.sign(
        {
          id: account.id,
          email: account.email,
          role: account.role,
        },
        configs.JWT_SECRET,
        {
          expiresIn: '4h',
        }
      )

      return {
        token: token,
        account: {
          id: account.id,
          email: account.email,
          role: account.role,
        },
      }
    } catch (error) {
      throw error
    }
  },
})

module.exports = registrationService
