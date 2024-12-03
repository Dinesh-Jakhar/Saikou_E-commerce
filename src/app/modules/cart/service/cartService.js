// const registrationRepository = require("../../registration/repository/registrationRepository");

const cartService = ({
  cartRepository,
  CustomError,
  HTTP_ERRORS,
  writerSequelize,
}) => ({
  addToCart: async (productId, quantity, userId) => {
    const transaction = await writerSequelize.transaction()
    try {
      const productInventory = await cartRepository.getProductInventory(
        productId,
        { transaction }
      )
      if (!productInventory) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'No Such Product Exists',
        })
      }

      const availableStock = productInventory.inventory.quantity
      if (availableStock < quantity) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Insufficient stock',
        })
      }
      const session = await cartRepository.getOrCreateSession(
        userId,
        transaction
      )
      const cartItem = await cartRepository.addCartItem(
        session.id,
        productId,
        quantity,
        availableStock,
        userId,
        transaction
      )
      await transaction.commit()
      return cartItem
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
  updateProductCount: async (userId, productId, count, sessionId) => {
    try {
      const productInventory =
        await cartRepository.getProductInventory(productId)
      if (!productInventory) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'No Such Product Exists',
        })
      }
      const availableStock = productInventory.inventory.quantity
      const cart_item = await cartRepository.cart_item(
        userId,
        productId,
        sessionId
      )
      if (!cart_item) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'No Such Cart Exists with the given Product',
        })
      }
      const totalCount = cart_item.quantity + count
      if (totalCount < 0 || totalCount > availableStock) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Insufficient stock',
        })
      } else if (totalCount == 0) {
        cart_item.quantity = 0 //Can automatically delete //TODO
        await cart_item.destroy()
        return 'Item Removed Successfully'
      } else {
        cart_item.quantity = totalCount
        await cart_item.save()
        return 'Successfully Updated the Count'
      }
    } catch (error) {
      throw error
    }
  },
})

module.exports = cartService
