const productRepository = ({ writerDatabase, readerDatabase, logger }) => ({
  allProducts: async () => {
    try {
      const productModel = await readerDatabase('Product')
      const inventoryModel = await readerDatabase('Inventory')
      const discountModel = await readerDatabase('Discount')

      const allProds = await productModel.findAll({
        include: [
          {
            model: discountModel,
            attributes: ['id', 'name', 'discount_percent', 'deleted_at'],
            as: 'discounts',
          },
          {
            model: inventoryModel,
            attributes: ['quantity'],
            as: 'inventory',
          },
        ],
      })
      return allProds
    } catch (error) {
      throw error
    }
  },
  discountExists: async (discountId) => {
    try {
      const discountModel = await readerDatabase('Discount')
      const discount = await discountModel.findOne({
        where: { id: discountId },
        paranoid: true,
      })
      return discount
    } catch (error) {
      throw error
    }
  },
  addNewProduct: async (
    name,
    desc,
    price,
    discountId,
    unitsInStock,
    imageUrls
  ) => {
    try {
      const productModel = await writerDatabase('Product')
      const product = await productModel.create({
        name,
        desc,
        price,
        discountId,
        unitsInStock,
        imageUrls,
      })
      return product
    } catch (error) {
      throw error
    }
  },
})

module.exports = productRepository
