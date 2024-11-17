module.exports = ({ healthCheckService, logger }) => ({
  getStatus: async (req, res, next) => {
    try {
      res.json({
        status: 'ok',
      })
    } catch (e) {
      logger.error('Failed to retrieve data:', error)
      next(e)
    }
  },

  create: async (req, res, next) => {
    try {
      const record = await healthCheckService.createHealthCheckRecord(req.body)
      res.json(record)
    } catch (error) {
      logger.error('Failed to retrieve data:', error)
      next(error)
    }
  },

  update: async (req, res, next) => {
    try {
      var id = req.params['id']
      var data = req.body
      data.id = id
      const record = await healthCheckService.updateHealthCheckRecord(data)
      res.json(record)
    } catch (error) {
      logger.error('Failed to retrieve data:', error)
      next(error)
    }
  },

  getSingleStatus: async (req, res, next) => {
    try {
      const record = await healthCheckService.getHealthCheckRecordById(
        req.params['id']
      )
      res.json(record)
    } catch (error) {
      logger.error('Failed to retrieve data:', error)
      next(error)
    }
  },

  getAllStatusFromDb: async (req, res, next) => {
    try {
      const records = await healthCheckService.getAllHealthCheckRecords()
      res.json(records)
    } catch (error) {
      logger.error('Failed to retrieve data:', error)
      next(error)
    }
  },
})
