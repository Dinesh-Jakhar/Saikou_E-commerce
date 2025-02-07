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
  checkIfExistsByID: async (id) => {
    try {
      const userModel = await readerDatabase('User')
      const acc = await userModel.findOne({ where: { id } })
      return acc
    } catch (error) {
      throw error
    }
  },
  add_an_address: async (
    userId,
    name,
    addressLine1,
    addressLine2,
    city,
    districtOrCounty,
    stateOrRegion,
    postalCode,
    countryCode,
    phone,
    address_type
  ) => {
    try {
      const Address = await writerDatabase('Address')
      const newAddress = await Address.create({
        userId,
        name,
        addressLine1,
        addressLine2,
        city,
        districtOrCounty,
        stateOrRegion,
        postalCode,
        countryCode,
        phone,
        address_type: address_type || 'home',
      })
      return newAddress
    } catch (error) {
      throw error
    }
  },
  get_All_address: async (userId) => {
    try {
      const Address = await readerDatabase('Address')
      const allAddress = await Address.findAll({
        where: {
          userId,
        },
      })
      return allAddress
    } catch (error) {
      throw error
    }
  },
  deleteAddress: async (userId, addressId) => {
    try {
      const Address = await writerDatabase('Address')
      const currAddress = await Address.findOne({
        where: {
          userId,
          id: addressId,
        },
      })
      const del_address = await currAddress.destroy()
      return del_address
    } catch (error) {
      throw error
    }
  },
  createAccount: async (firstName, lastName, email, hashedPassword) => {
    try {
      const userModel = await writerDatabase('User')
      const accountData = await userModel.create({
        firstName,
        lastName,
        email,
        role: 'user',
        emailVerified: false,
        password: hashedPassword,
      })
      return accountData
    } catch (error) {
      logger.error('Error while signing Up:', error)
      throw error
    }
  },
})

module.exports = registrationRepository
