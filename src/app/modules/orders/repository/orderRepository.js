const { Op } = require('sequelize') // Import Sequelize operators

const cartRepository = ({
  writerDatabase,
  readerDatabase,
  CustomError,
  HTTP_ERRORS,
}) => ({
  checkForValidSessionId: async (sessionId) => {
    try {
      const sessionModel = await readerDatabase('ShoppingSession')
      const session = await sessionModel.findOne({
        where: {
          id: sessionId,
          status: 'active',
        },
      })
      return session
    } catch (error) {
      throw error
    }
  },
  findAllCartProducts: async (sessionId) => {
    try {
      const cartItemModel = await readerDatabase('CartItem')
      const data = await cartItemModel.findAll({
        where: { sessionId },
        attributes: ['productId', 'quantity'],
      })
      return data
    } catch (error) {
      throw error
    }
  },
  findProductAndDiscountDetails: async (productId) => {
    try {
      const productModel = await readerDatabase('Product')
      const inventoryModel = await readerDatabase('Inventory')
      const discountModel = await readerDatabase('Discount')
      const productDetails = await productModel.findAll({
        where: { id: productId },
        include: [
          {
            model: inventoryModel,
            as: 'inventory',
            attributes: ['productId', 'quantity'],
          },
          {
            model: discountModel,
            as: 'discounts',
            attributes: ['id', 'name', 'discountPercent'],
            paranoid: true,
          },
        ],
      })
      return productDetails
    } catch (error) {
      throw error
    }
  },
  createOrderDetail: async (
    sessionId,
    userId,
    totalAmount,
    orderItemsToCreate,
    transaction
  ) => {
    try {
      const orderDetailModel = await writerDatabase('OrderDetail')
      const OrderItemModel = await writerDatabase('OrderItem')
      const orderDetail = await orderDetailModel.create(
        {
          userId: userId,
          total: totalAmount,
        },
        {
          transaction,
        }
      )
      const orderItemsWithOrderId = orderItemsToCreate.map((orderItem) => ({
        ...orderItem,
        orderId: orderDetail.id,
      }))

      await OrderItemModel.bulkCreate(orderItemsWithOrderId, {
        transaction,
      })

      return orderDetail
    } catch (error) {
      throw error
    }
  },
  createPaymentDetails: async (paymentDetails, transaction) => {
    try {
      const PaymentDetailsModel = await writerDatabase('PaymentDetails')
      return await PaymentDetailsModel.create(paymentDetails, { transaction })
    } catch (error) {
      console.log(error)
      throw new Error('Failed to create payment details')
    }
  },
  updateUserCart: async (userId) => {
    try {
      const ShoppingSessionTable = await writerDatabase('ShoppingSession')
      const CartItemModel = await writerDatabase('CartItem')
      const updatedSession = await ShoppingSessionTable.update(
        { status: 'inactive' },
        { where: { userId: userId } }
      )
      await CartItemModel.destroy({
        where: { userId: userId },
      })
      return updatedSession
    } catch (error) {
      throw error
    }
  },
  updatedOrderDetail: async (orderId, status) => {
    try {
      const OrderDetail = await writerDatabase('OrderDetail')
      const updatedOrder = await OrderDetail.update(
        { order_status: status },
        { where: { id: orderId } }
      )
      return updatedOrder
    } catch (error) {
      console.error('Error updating order status:', error)
      throw new Error('Error updating order status')
    }
  },
  softDeleteOrder: async (orderId) => {
    try {
      const OrderDetailTable = await writerDatabase('OrderDetail')
      const OrderItemsTable = await writerDatabase('OrderItem')
      await OrderItemsTable.destroy({
        where: { orderId: orderId },
      })
      await OrderDetailTable.destroy({
        where: { id: orderId },
      })
      return 'updated_Successful'
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
  updatePaymentTable: async (
    paymentId,
    orderId,
    payment_method_id,
    status,
    amount_received,
    failureMessage = null
  ) => {
    try {
      const amountReceivedInDollars = amount_received / 100
      const PaymentDetailsModel = await writerDatabase('PaymentDetails')
      const updatedPayment = await PaymentDetailsModel.update(
        {
          paymentId: paymentId,
          orderId: orderId,
          status: status,
          payment_method_id: payment_method_id,
          amount: amountReceivedInDollars, // Amount received (should be in the smallest unit)
          paymentConfirmationTimestamp: new Date(),
          failureReason: failureMessage,
        },
        {
          where: {
            orderId: orderId,
          },
        }
      )
      return updatedPayment
    } catch (error) {
      console.error('Error updating payment table:', error)
      throw error
    }
  },
})

module.exports = cartRepository
