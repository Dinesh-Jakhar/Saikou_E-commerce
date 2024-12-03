module.exports = ({ cartService, CustomError, HTTP_ERRORS }) => ({
  addToCart: async (req, res, next) => {
    try {
      const { productId, quantity } = req.body
      const userId = req.user.id

      const cartSession = await cartService.addToCart(
        productId,
        quantity,
        userId
      )
      return res.status(201).json({
        status: 'success',
        message: 'Product added to cart successfully',
        cart: cartSession,
      })
    } catch (error) {
      return next(error)
    }
  },
  updateProductCount: async (req, res, next) => {
    try {
      const { productId, count, sessionId } = req.body
      const userId = req.user.id
      const updatedCount = await cartService.updateProductCount(
        userId,
        productId,
        count,
        sessionId
      )
      return res.status(200).json({
        status: 'success',
        message: updatedCount,
      })
    } catch (error) {
      return next(error)
    }
  },
})
