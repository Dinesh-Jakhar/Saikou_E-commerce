const { createContainer, asFunction, Lifetime, asValue } = require('awilix')
const modulePaths = require('../infra/database/db_exposed_models')
const { ROUTES_PATH } = require('./constants/constants')
const {
  readerDatabase,
  writerDatabase,
  writerSequelize,
  readerSequelize,
  Sequelize,
} = require('../infra/database/database')
const path = require('node:path')
const emailService = require('./config/emailService')
const stripe = require('./config/stripe')
const logger = require('./logger/logger')
const asyncErrorHandler = require('../middlewares/error_handler/async_errors')
const CustomError = require('../middlewares/error_handler/CustomError')
const ERRORS = require('../middlewares/error_handler/errors/errors')
const constants = require('./constants/constants')
const fs = require('fs')
const HTTP_ERROR = require('../middlewares/error_handler/errors/http_errors')
const config = require('./config/config')
const stream = require('node:stream')

const container = createContainer({
  injectionMode: 'PROXY',
})

// loading databases and other entities
container.register({
  readerDatabase: asValue(readerDatabase),
  writerDatabase: asValue(writerDatabase),
  writerSequelize: asValue(writerSequelize),
  readerSequelize: asValue(readerSequelize),

  logger: asValue(logger),

  asyncErrorHandler: asValue(asyncErrorHandler),
  CustomError: asValue(CustomError),
  ERRORS: asValue(ERRORS),
  emailService: asValue(emailService),
  stripe: asValue(stripe),
  constants: asValue(constants),
  HTTP_ERRORS: asValue(HTTP_ERROR),
  fs: asValue(fs),
  constants: asValue(constants),
  configs: asValue(require('./config/config')),
  crypto: asValue(require('node:crypto')),
  config: asValue(config),
  path: asValue(path),
  stream: asValue(stream),
})

modulePaths.forEach((module) => {
  // loading repository
  container.loadModules(
    [path.join(__dirname, ROUTES_PATH, module, '/repository/*.js')],
    {
      cwd: __dirname,
      resolverOptions: {
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    }
  )
  //loading service
  container.loadModules(
    path.join(__dirname, ROUTES_PATH, module, '/service/*.js'),
    {
      cwd: __dirname,
      resolverOptions: {
        lifetime: Lifetime.SINGLETON,
        register: asFunction,
      },
    }
  )
  container.loadModules(
    path.join(__dirname, ROUTES_PATH, module, '/controller/*.js'),
    {
      cwd: __dirname,
      resolverOptions: {
        lifetime: Lifetime.SINGLETON,
        register: asFunction,
      },
    }
  )
})

module.exports = container
