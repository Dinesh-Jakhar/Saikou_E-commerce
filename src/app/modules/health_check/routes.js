const { createController } = require('awilix-express')
const healthCheck_controller = require('./controller/healthCheck_controller')
const payloadValidationMiddleware = require('../../../middlewares/payload_validation/payload_validation')
const dto = require('./controller/dto')

const healthCheckController = createController(healthCheck_controller)
  .prefix('/healthCheck') // parent path
  .get('/getstatus', 'getStatus')
  .post('/', 'create', {
    before: [payloadValidationMiddleware(dto.createHealthCheckSchema)],
  })
  .get('/status', 'getAllStatusFromDb')
  .get('/status/:id', 'getSingleStatus')
  .put('/:id', 'update')

module.exports = healthCheckController
