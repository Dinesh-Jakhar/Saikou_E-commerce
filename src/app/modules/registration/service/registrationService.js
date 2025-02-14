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
  queues,
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
          role: account.role,
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
  send_query: async (name, email, message) => {
    try {
      const emailTitle = `New Contact Us Query`
      const emailBody = `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p>This is an automated notification from your website's contact form.</p>
      `
      const adminEmail = configs.ADMIN_EMAIL
      await queues.addEmailToQueue(adminEmail, emailTitle, emailBody)
      return
    } catch (error) {
      throw error
    }
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
          role: account.role,
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
      const resetLink = `${configs.FRONTEND_URL || 'http://localhost:8080/api/v1/user'}/reset-password?token=${token}`
      account.otpExpiresAt = Date.now()
      account.resetToken = token
      await account.save()

      //send the otp
      const title = 'Reset Your Password'

      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; text-align: center;">
          
          <div style="padding-bottom: 20px;">
            <img src=${configs.EMAIL_LOGO_URL} alt="Company Logo" style="max-width: 150px;">
          </div>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333;">🔑 Password Reset Request</h2>
            <p style="font-size: 16px; color: #555;">We received a request to reset your password.</p>
            <p style="font-size: 16px; color: #555;">Click the button below to set a new password:</p>

            <div style="margin: 20px 0;">
              <a href="${resetLink}" target="_blank"
                style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 14px; color: #777;">This link will expire in <strong>10 minutes</strong>.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

            <p style="font-size: 14px; color: #777;">If you did not request a password reset, please ignore this email.</p>

            <p style="font-size: 14px; color: #777;">
              Need help? Contact us at 
              <a href="mailto:customercare@saikouherbs.com" style="color: #007bff;">support@saikouherbs.com</a>
            </p>
          </div>

          <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
            &copy; ${new Date().getFullYear()} YourCompany. All rights reserved.
          </p>

        </div>
      `

      await queues.addEmailToQueue(email, title, body)
      // await emailService.mailSender(email, title, body)
      return
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
  add_an_address: async (
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
  ) => {
    try {
      return await registrationRepository.add_an_address(
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
    } catch (error) {
      throw error
    }
  },
  get_All_address: async (userId) => {
    try {
      return await registrationRepository.get_All_address(userId)
    } catch (error) {
      throw error
    }
  },
  deleteAddress: async (userId, addressId) => {
    try {
      return await registrationRepository.deleteAddress(userId, addressId)
    } catch (error) {
      throw error
    }
  },
})

module.exports = registrationService
