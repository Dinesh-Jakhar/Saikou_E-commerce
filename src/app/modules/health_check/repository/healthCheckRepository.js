const healthCheckRepository = ({ writerDatabase, readerDatabase, logger }) => ({
  createHealthCheckRecord: async (data) => {
    try {
      const model = await writerDatabase('healthCheck')
      const healthCheckRecord = await model.create(data)
      return healthCheckRecord
    } catch (error) {
      logger.error('Error creating healthChcek record:', error)
      throw error
    }
  },
  updateHealthCheckRecordById: async (data) => {
    try {
      const model = await writerDatabase('healthCheck')
      const healthCheckRecord = await model.update(
        {
          currentVersion: data.currentVersion,
        },
        {
          where: {
            id: data.id,
          },
        }
      )
      return healthCheckRecord
    } catch (error) {
      logger.error('Error creating healthChcek record:', error)
      throw error
    }
  },

  getHealthCheckById: async (id) => {
    try {
      const model = await readerDatabase('healthCheck')
      const healthCheckRecord = await model.findByPk(id)
      return healthCheckRecord
    } catch (error) {
      logger.error('Error fetching healthChcek record:', error)
      throw error
    }
  },

  getAllHealthCheckRecords: async () => {
    try {
      const model = await readerDatabase('healthCheck')
      const healthCheckRecords = await model.findAll()
      return healthCheckRecords
    } catch (error) {
      logger.error('Error fetching all healthChcek records:', error)
      throw error
    }
  },
})

module.exports = healthCheckRepository
