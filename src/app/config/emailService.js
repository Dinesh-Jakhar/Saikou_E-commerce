const nodemailer = require('nodemailer')
const config = require('./config')

const createTransporter = () => {
  if (!config.MAIL_HOST || !config.MAIL_USER || !config.MAIL_PASS) {
    throw new Error('Mail configuration is missing in environment variables.')
  }

  return nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: config.MAIL_PORT || 587,
    secure: config.MAIL_SECURE === 'true',
    auth: {
      user: config.MAIL_USER,
      pass: config.MAIL_PASS,
    },
  })
}

const mailSender = async (email, title, body) => {
  try {
    const transporter = createTransporter()
    const info = await transporter.sendMail({
      from: `${config.MAIL_SENDER_NAME || 'No-Reply'} <${config.MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    })
    return info
  } catch (error) {
    console.error('Error sending email:', error.message)
    throw new Error('Failed to send email. Please try again later.')
  }
}

module.exports = { mailSender }
