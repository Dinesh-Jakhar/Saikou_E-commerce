const { v4: uuidv4 } = require('uuid')

module.exports = ({ productService, CustomError }) => ({
  allProducts: async (req, res, next) => {
    try {
      const allProds = await productService.allProductsRoleWise()
      return res.status(200).json({
        products: allProds,
      })
    } catch (error) {
      return next(error)
    }
  },
  addNewProduct: async (req, res, next) => {
    try {
      const { name, desc, price, discountId, unitsInStock } = req.body
      const mainImage = req.files?.mainImage?.[0]?.filename || null
      const descImages =
        req.files?.descImages?.map((file) => file.filename) || []

      // Construct relative paths with the generated productId
      const mainImagePath = mainImage
        ? `/uploads/products/${name}/${mainImage}`
        : null
      const descImagesPaths = descImages.map(
        (file) => `/uploads/products/${name}/${file}`
      )

      if (discountId) {
        const discountExists = await productService.discountExists(discountId)
        if (!discountExists) {
          throw new CustomError({
            statusCode: 400,
            message: 'Invalid discountId',
            errors: 'The provided discountId does not exist.',
          })
        }
      }
      const product = await productService.addNewProduct({
        name,
        desc,
        price,
        discountId,
        unitsInStock,
        imageUrls: [mainImagePath, ...descImagesPaths],
      })
      return res.status(201).json({
        message: 'Product Created Successfully',
        product,
      })
    } catch (error) {
      return next(error)
    }
  },
})
