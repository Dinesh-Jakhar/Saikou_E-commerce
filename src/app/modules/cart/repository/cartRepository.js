const { Op } = require('sequelize') // Import Sequelize operators

const cartRepository = ({
  writerDatabase,
  readerDatabase,
  CustomError,
  HTTP_ERRORS,
}) => ({
  getProductInventory: async (id, options = {}) => {
    try {
      const productModel = await readerDatabase('Product')
      const inventoryModel = await readerDatabase('Inventory')
      const myProd = await productModel.findOne({
        include: [
          {
            model: inventoryModel,
            attributes: ['quantity'],
            as: 'inventory',
            paranoid: true,
          },
        ],
        attributes: ['id', 'name', 'price'],
        where: { id: id },
        paranoid: true,
        transaction: options.transaction || null,
      })
      return myProd
    } catch (error) {
      throw error
    }
  },

  getOrCreateSession: async (userId, transaction) => {
    try {
      const ShoppingSession = await writerDatabase('ShoppingSession')
      const session = await ShoppingSession.findOrCreate({
        where: { userId, status: 'active' },
        defaults: {
          userId,
          status: 'active',
        },
        transaction,
      })

      return session[0]
    } catch (error) {
      console.log('Error in getOrCreateSession:', error)
      throw error
    }
  },
  addCartItem: async (
    sessionId,
    productId,
    quantity,
    availableStock,
    userId,
    transaction
  ) => {
    try {
      const CartItem = await writerDatabase('CartItem')
      const cartItem = await CartItem.findOne({
        where: { sessionId, productId },
        transaction,
      })

      if (cartItem) {
        if (cartItem.quantity + quantity > availableStock) {
          throw new CustomError({
            ...HTTP_ERRORS.BAD_REQUEST,
            errors: 'Insufficient stock',
          })
        }
        cartItem.quantity += quantity
        await cartItem.save({ transaction })
      } else {
        await CartItem.create(
          {
            sessionId,
            productId,
            quantity,
            userId,
          },
          { transaction }
        )
      }

      return cartItem || 'Product added successfully'
    } catch (error) {
      console.error('Error in addToCart:', error)
      throw error
    }
  },
  cart_item: async (userId, productId, sessionId) => {
    try {
      const cartItemModel = await writerDatabase('CartItem')
      const cartItem = await cartItemModel.findOne({
        where: {
          [Op.and]: [{ userId }, { productId }, { sessionId }],
        },
      })
      return cartItem
    } catch (error) {
      throw error
    }
  },
})

module.exports = cartRepository
