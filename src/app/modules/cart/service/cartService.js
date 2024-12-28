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
      if (availableStock == null) {
        throw new CustomError({
          ...HTTP_ERRORS.INTERNAL_SERVER_ERROR,
          errors: 'Inventory information is unavailable',
        })
      }

      const cart_item = await cartRepository.cart_item(
        userId,
        productId,
        sessionId,
        transaction
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
        await cart_item.destroy({ transaction })
        await transaction.commit()
        return 'Item Removed Successfully'
      } else {
        cart_item.quantity = totalCount
        await cart_item.save({ transaction })
        await transaction.commit()
        return 'Successfully Updated the Count'
      }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
  getCartItems: async function (userId) {
    try {
      const session = await cartRepository.getShoppingSession(userId)
      if (!session) {
        return 'Cart is Empty'
      }
      const sessionId = session.id
      const cartItems = await cartRepository.cartItemsOfUser(sessionId)
      const processCartItems = await this.processCartItems(cartItems)
      return { ...processCartItems, sessionId }
    } catch (error) {
      throw error
    }
  },
  processCartItems: async function (cartItems) {
    if (!Array.isArray(cartItems)) {
      cartItems = [cartItems]
    }
    const processedItems = cartItems.map((cartItem) => {
      const product = cartItem.product

      if (!product || !product.inventory) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: `Product or inventory details are missing for product ID ${cartItem.productId}`,
        })
      }
      const basePrice = parseFloat(product.price)
      const discountPercent = product.discounts
        ? parseFloat(product.discounts.dataValues.discount_percent)
        : 0
      const availableStock = parseInt(product.inventory.quantity, 10)
      const cartQuantity = parseInt(cartItem.quantity, 10)
      const anyOffer = discountPercent == 0 ? 'No Sale' : 'In Sale'
      // Calculate the final price after discount
      const finalPrice = basePrice - (basePrice * discountPercent) / 100
      // Check stock availability
      let message = 'InStock'
      if (cartQuantity > availableStock) {
        message = 'OutOfStock'
      }

      // Return the processed item details
      return {
        cartItemId: cartItem.id,
        productId: product.id,
        name: product.name,
        description: product.desc,
        basePrice,
        discountPercent,
        finalPrice: finalPrice.toFixed(2), // Round to 2 decimal places
        quantity: cartQuantity,
        availableStock,
        message,
        totalPrice: (finalPrice * cartQuantity).toFixed(2), // Total price for the quantity
        imageUrls: product.imageUrls,
        anyOffer: anyOffer,
      }
    })

    return processedItems
  }, //////
})

module.exports = cartService
