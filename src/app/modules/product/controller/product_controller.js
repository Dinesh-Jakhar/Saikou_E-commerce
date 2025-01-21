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
  getASingleProduct: async (req, res, next) => {
    try {
      const id = req.params.productId
      const myProd = await productService.getASingleProduct(id)
      return res.status(200).json({
        product: myProd,
      })
    } catch (error) {
      return next(error)
    }
  },
  addNewProduct: async (req, res, next) => {
    try {
      const {
        name,
        desc,
        price,
        discountId,
        unitsInStock,
        sellerSku,
        fnSku,
        asin,
      } = req.body
      // const mainImage = req.files?.mainImage?.[0];
      // const descImages = req.files?.descImages || [];
      const all_files = req.body.files || {}
      const mainImageFile = all_files.mainImage?.[0] || null
      const descImageFiles = all_files.descImages || []

      const mainImagePath = mainImageFile
        ? `/uploads/products/${mainImageFile}`
        : null
      const descImagePaths = descImageFiles.map(
        (filename) => `/uploads/products/${filename}`
      )

      const imageUrls = [mainImagePath, ...descImagePaths]

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
        imageUrls,
        // mainImage,
        // descImages,
        sellerSku,
        fnSku,
        asin,
      })
      return res.status(201).json({
        message: 'Product Created Successfully',
        product,
      })
    } catch (error) {
      return next(error)
    }
  },
  updateProduct: async (req, res, next) => {
    try {
      const { id, name, desc, price, discountId, quantity } = req.body
      const updatedProduct = await productService.updateProduct(
        id,
        name,
        desc,
        price,
        discountId,
        quantity
      )
      return res.status(201).json({
        message: 'Updated Successfully',
        count: updatedProduct,
      })
    } catch (error) {
      return next(error)
    }
  },
  addDiscount: async (req, res, next) => {
    try {
      const { name, desc, discountPercent } = req.body
      const createDiscount = await productService.createDiscount(
        name,
        desc,
        discountPercent
      )
      return res.status(201).json({
        message: 'Discount Created Successfully',
        discountInfo: createDiscount,
        errors: '',
      })
    } catch (error) {
      return next(error)
    }
  },
})
