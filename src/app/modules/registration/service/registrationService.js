const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const jwtHelper = require('../../../../middlewares/jwt/jwt_helper')

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
          firstName: account.firstName,
        },
      }
      // const { otp, expiresAt } = this.generateOtp()
      // account.otp = otp
      // account.otpExpiresAt = expiresAt
      // await account.save() //send the otp
      // const title = 'Verify Your Email'
      // const body = `The Otp is valid for 10min: ${otp}`
      // await emailService.mailSender(email, title, body)
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
      // if (!account.emailVerified) {
      //   const { otp, expiresAt } = this.generateOtp()
      //   account.otp = otp
      //   account.otpExpiresAt = expiresAt
      //   await account.save() //send the otp
      //   const title = 'Verify Your Email'
      //   const body = `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`
      //   await emailService.mailSender(email, title, body)
      //   throw new CustomError({
      //     ...ERRORS.EMAIL_NOT_VERIFIED,
      //     errors: 'OTP has been sent on your email. Please verify your email',
      //   })
      // }
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
          firstName: account.firstName,
        },
      }
    } catch (error) {
      throw error
    }
  },
  forgotPassword: async (email) => {
    try {
      const account = await registrationRepository.checkIfExists(email)
      if (!account) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Email doesnot exists',
        })
      }
      // if (otp !== account.otp) {
      //   throw new CustomError({
      //     ...HTTP_ERRORS.BAD_REQUEST,
      //     errors: 'Invalid OTP',
      //   })
      // }
      //const currentDate = Date.now()
      // if (currentDate > account.otpExpiresAt) {
      //   throw new CustomError({
      //     ...HTTP_ERRORS.BAD_REQUEST,
      //     errors: 'OTP expired',
      //   })
      // }

      // account.emailVerified = true
      // account.otp = null
      // account.otpExpiresAt = null
      // await account.save()

      const token = jwt.sign(
        {
          id: account.id,
          email: account.email,
        },
        configs.JWT_SECRET,
        {
          expiresIn: '10m',
        }
      )
      const resetLink = `${configs.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${token}`
      account.otpExpiresAt = Date.now()
      account.resetToken = token
      await account.save()

      //send the otp
      const title = 'Reset-Password'
      const body = `<p>Reset Your Password:</p>
      <a href="${resetLink}" target="_blank">${resetLink}</a>
      <p>This link will expire in 10 minutes.</p>`
      await emailService.mailSender(email, title, body)
      return account
      // return {
      //   token: token,
      //   account: {
      //     id: account.id,
      //     email: account.email,
      //   },
      // }
    } catch (error) {
      throw error
    }
  },
  resetPassword: async (email, newPassword, token) => {
    try {
      try {
        const decoded = jwtHelper.verifyToken(token)
        const decodedKeys = Object.keys(decoded)

        if (decodedKeys.length < 1 || !decodedKeys.includes('id')) {
          throw new CustomError({
            ...HTTP_ERRORS.BAD_REQUEST,
            errors: 'Invalid token',
          })
        }
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          throw new CustomError(ERRORS.TOKEN_EXPIRED)
        } else if (err.name === 'JsonWebTokenError') {
          throw new CustomError(ERRORS.INVALID_TOKEN)
        }
      }

      const account = await registrationRepository.checkIfExists(email)
      if (!account) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Invalid ID',
        })
      }
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
      account.password = hashedPassword
      await account.save()
      return account
    } catch (error) {
      throw error
    }
  },
})

module.exports = registrationService
