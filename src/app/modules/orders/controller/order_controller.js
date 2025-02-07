const bodyParser = require('body-parser')
module.exports = ({
  orderService,
  CustomError,
  HTTP_ERRORS,
  // SellingPartner,
}) => ({
  returnOrder: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { order_id, return_reason } = req.body
      const returned = await orderService.returnOrder(
        order_id,
        return_reason,
        userId
      )
      return res.status(201).json({
        status: 'success',
        message: 'Return Placed Successfully',
      })
    } catch (error) {
      return next(error)
    }
  },
  checkOutTheOrder: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { sessionId, addressId } = req.body
      //check if valid session_id
      const isValid = await orderService.checkForValidSessionId(
        sessionId,
        userId
      )
      if (!isValid) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Session Id is not valid',
        })
      }
      const checkout = await orderService.checkOutTheOrder(
        sessionId,
        userId,
        addressId
      )
      return res.status(201).json({
        status: 'success',
        checkout,
      })
    } catch (error) {
      return next(error)
    }
  },
  myStripeWebhook: async (req, res, next) => {
    try {
      const sig = req.headers['stripe-signature']
      const hookBody = req.body
      await orderService.myStripeWebhook(hookBody, sig)
      return res.status(200).json({ received: true })
      //sendResponseTOFrontend
    } catch (error) {
      console.log(error.message)
      return res.status(400).send(`Webhook Error: ${error.message}`)
    }
  },
  getMyOrders: async (req, res, next) => {
    try {
      const userId = req.user.id
      const myOrders = await orderService.getMyOrders(userId)
      return res.status(200).json({
        myOrders,
      })
    } catch (error) {
      return next(error)
    }
  },
  updateOrderStatus: async (paymentIntentId, status) => {
    // Update the order status in the database based on the payment status
    try {
      // Example database query to update the payment status of an order
      await Order.update(
        { payment_status: status },
        { where: { payment_intent_id: paymentIntentId } }
      )
      console.log(`Order status updated to: ${status}`)
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  },
  getAllOrders: async (req, res, next) => {
    try {
      const orders = await orderService.listAllFulfillmentOrdersFromDB()

      return res.status(200).json({
        success: true,
        orders,
      })
    } catch (error) {
      return next(error)
    }
  },
})
