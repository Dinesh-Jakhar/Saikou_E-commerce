const registrationRepository = ({
  writerDatabase,
  readerDatabase,
  logger,
}) => ({
  checkIfExists: async (email) => {
    try {
      const userModel = await readerDatabase('User')
      const acc = await userModel.findOne({ where: { email } })
      return acc
    } catch (error) {
      throw error
    }
  },
  createAccount: async (firstName, lastName, email) => {
    try {
      const userModel = await writerDatabase('User')
      const accountData = await userModel.create({
        firstName,
        lastName,
        email,
        role: 'user',
        emailVerified: false,
      })
      return accountData
    } catch (error) {
      logger.error('Error while signing Up:', error)
      throw error
    }
  },
})

module.exports = registrationRepository
