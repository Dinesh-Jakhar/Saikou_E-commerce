const express = require('express')
const app = express()
const path = require('path')
const {
  initializeDatabase,
  closeDbConnections,
} = require('../infra/database/database')
const cors = require('../middlewares/cors/cors')
const config = require('./../app/config/config')
const error_handler = require('../middlewares/error_handler/error_handler')
// const authenticateJWT = require('../middlewares/jwt/jwt_authentication')
const { logger, errorLogger } = require('../middlewares/logger/http_logger')(
  'logger'
)
const passport = require('passport') // ✅ Import Passport.js
require('../app/config/passport-config')
const { setStopServerFunction } = require('../app/config/queues')
module.exports = () => {
  const router = require('./router')('router')

  initializeDatabase()

  // middlewares
  app.use(cors())
  app.use(passport.initialize())
  app.use(logger)
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
  app.use(router)
  app.use(errorLogger)
  app.use(error_handler)

  const startServer = async () => {
    return new Promise((resolve, reject) => {
      const http = app.listen(config.PORT, () => {
        const { port } = http.address()
        console.log(`Application started at port: ${port}`)
        resolve(http)
      })
      http.keepAliveTimeout = 100000
      http.headersTimeout = 12000

      http.on('error', (error) => {
        reject(error)
      })
    })
  }

  const stopServer = async () => {
    console.log('Stopping server !!! ')
    await closeDbConnections()
    await setStopServerFunction()
    process.exit(0)
  }
  setStopServerFunction(stopServer)

  return {
    app,
    startServer,
    stopServer,
  }
}
