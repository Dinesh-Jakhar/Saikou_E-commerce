const productService = ({
  productRepository,
  CustomError,
  HTTP_ERRORS,
  ERRORS,
  configs,
}) => ({
  allProductsRoleWise: async () => {
    const allProds = await productRepository.allProducts()
    return allProds
  },
  discountExists: async (discountId) => {
    try {
      return (findDiscount = await productRepository.discountExists(discountId))
    } catch (error) {
      throw error
    }
  },
  addNewProduct: async ({
    name,
    desc,
    price,
    discountId,
    unitsInStock,
    imageUrls,
  }) => {
    try {
      const product = await productRepository.addNewProduct(
        name,
        desc,
        price,
        discountId,
        unitsInStock,
        imageUrls
      )
      return product
    } catch (error) {
      throw error
    }
  },
})

module.exports = productService
