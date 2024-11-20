const { Router } = require('express')
const { urlencoded, json } = require('body-parser')
const bodyParserErrorHandler = require('express-body-parser-error-handler')
const CustomError = require('../middlewares/error_handler/CustomError')
const HTTP_ERROR = require('../middlewares/error_handler/errors/http_errors')
const { loadControllers, scopePerRequest } = require('awilix-express')
const path = require('node:path')
const { ROUTES_PATH } = require('../app/constants/constants')
const moduleNames = require('../infra/database/db_exposed_models')
const appContainer = require('../app/container')

module.exports = () => {
  const apiRouter = Router()
  apiRouter
    .use(
      urlencoded({
        limit: '2mb',
        extended: true,
        parameterLimit: 20000,
      })
    )
    .use(json({ limit: '2mb' }))
    .use(bodyParserErrorHandler())
  // will load routes automatically
  moduleNames.forEach((module) => {
    //   const routePath = path.join(__dirname, ROUTES_PATH, module, '/routes.js');
    // console.log(`Loading route from: ${routePath}`);
    // apiRouter.use(loadControllers(routePath));
    apiRouter.use(
      loadControllers(path.join(__dirname, ROUTES_PATH, module, '/routes.js'))
    )
  })

  const router = Router()
  // using container as middleware
  router.use(scopePerRequest(appContainer))
  router.use(`/api/v1`, apiRouter)
  // last route that's handle route not found.
  router.use('*', routeNotFoundController)
  return router
}

const routeNotFoundController = (req, res, next) => {
  next(new CustomError({ ...HTTP_ERROR.NOT_FOUND, errors: 'route not found' }))
}
