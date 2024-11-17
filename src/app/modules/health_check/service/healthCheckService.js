const healthCheckService = ({ healthCheckRepository }) => ({
  createHealthCheckRecord: async (data) => {
    return await healthCheckRepository.createHealthCheckRecord(data)
  },

  updateHealthCheckRecord: async (data) => {
    return await healthCheckRepository.updateHealthCheckRecordById(data)
  },
  getHealthCheckRecordById: async (id) => {
    const result = await healthCheckRepository.getHealthCheckById(id)
    return result
  },
  getAllHealthCheckRecords: async () => {
    const result = await healthCheckRepository.getAllHealthCheckRecords()
    return result
  },
})

module.exports = healthCheckService
