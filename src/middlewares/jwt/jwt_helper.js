const config = require('../../app/config/config')
const jwt = require('jsonwebtoken')

const SECRET_KEY = config.JWT_SECRET

const generateToken = (payload, expireIn) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: expireIn })
}

const verifyToken = (token) => {
  return jwt.verify(token, SECRET_KEY)
}

const jwtHelper = { generateToken, verifyToken }
module.exports = jwtHelper
