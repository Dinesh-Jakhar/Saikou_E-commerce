const productService = ({
  productRepository,
  CustomError,
  HTTP_ERRORS,
  configs,
}) => ({
  topProducts: async function () {
    const prod_1 = configs.TOP_PRODUCT_1_ID
    const prod_2 = configs.TOP_PRODUCT_2_ID
    const prod_3 = configs.TOP_PRODUCT_3_ID
    const allTopProducts = await productRepository.topProducts(
      prod_1,
      prod_2,
      prod_3
    )
    if (allTopProducts == null || allTopProducts.length == 0) {
      return []
    }
    const enhancedProduct = await this.filterProducts(allTopProducts)
    return enhancedProduct
  },
  allProductsRoleWise: async function () {
    const allProds = await productRepository.allProducts()
    const enhancedProducts = await this.filterProducts(allProds)
    return enhancedProducts
  },
  getASingleProduct: async function (id) {
    try {
      const ifExists = await productRepository.getSingleProduct(id)
      if (!ifExists) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Give a valid Product Id',
        })
      }
      const enhancedProduct = await this.filterProducts(ifExists)
      return enhancedProduct
    } catch (error) {
      throw error
    }
  },
  filterProducts: async function (products) {
    if (!Array.isArray(products)) {
      products = [products]
    }
    const baseUrl = configs.SERVER_IMAGE_URL
    return products.map((product) => {
      const { dataValues } = product
      const discountPercent = dataValues.discounts
        ? parseFloat(dataValues.discounts.dataValues.discount_percent)
        : 0
      const actualPrice =
        parseFloat(dataValues.price) -
        (parseFloat(dataValues.price) * discountPercent) / 100
      const stockStatus =
        dataValues.inventory?.dataValues.quantity > 0
          ? 'In Stock'
          : 'Out of Stock'
      const saleStatus = discountPercent > 0 ? 'Sale' : 'No Sale'
      return {
        id: dataValues.id,
        name: dataValues.name,
        desc: dataValues.desc,
        price: dataValues.price,
        salePrice: actualPrice.toFixed(2),
        stockStatus,
        saleStatus,
        imageUrls:
          Array.isArray(dataValues.imageUrls) &&
          dataValues.imageUrls.length > 0 &&
          dataValues.imageUrls[0] !== null
            ? dataValues.imageUrls.map((image) => `${baseUrl}${image}`)
            : [],
        // imageUrls:Array.isArray(dataValues.imageUrls)
        // ? dataValues.imageUrls.map(image => `${baseUrl}${image}`): [],// (dataValues.imageUrls || []).map(image => `${baseUrl}${image}`),//dataValues.imageUrls,
        created_at: dataValues.created_at,
        discounts: dataValues.discounts,
        inventory: dataValues.inventory,
      }
    })
  },
  updateProduct: async (id, name, desc, price, discountId, quantity) => {
    try {
      return await productRepository.updateProduct(
        id,
        name,
        desc,
        price,
        discountId,
        quantity
      )
    } catch (error) {
      throw error
    }
  },
  createDiscount: async (name, desc, discountPercent) => {
    try {
      const discount = await productRepository.createDiscount(
        name,
        desc,
        discountPercent
      )
      return discount
    } catch (error) {
      throw error
    }
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
    // mainImage,
    // descImages,
    sellerSku,
    fnSku,
    asin,
  }) => {
    try {
      const product = await productRepository.addNewProduct(
        name,
        desc,
        price,
        discountId,
        unitsInStock,
        imageUrls,
        sellerSku,
        fnSku,
        asin
      )
      return product
    } catch (error) {
      throw error
    }
  },
})

module.exports = productService
