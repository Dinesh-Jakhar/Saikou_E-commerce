const express = require('express')
const app = express()

const {
  initializeDatabase,
  closeDbConnections,
} = require('../infra/database/database')
const cors = require('../middlewares/cors/cors')
const config = require('./../app/config/config')
const error_handler = require('../middlewares/error_handler/error_handler')
const { logger, errorLogger } = require('../middlewares/logger/http_logger')(
  'logger'
)

module.exports = () => {
  const router = require('./router')('router')

  initializeDatabase()

  // middlewares
  app.use(cors())
  app.use(logger)
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
    process.exit(0)
  }

  return {
    app,
    startServer,
    stopServer,
  }
}
