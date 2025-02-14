const orderService = ({
  orderRepository,
  CustomError,
  HTTP_ERRORS,
  writerSequelize,
  stripe,
  configs,
  emailService,
  queues,
}) => ({
  adminInfo_1: async () => {
    try {
      const salesAnalytics = await orderRepository.getSalesAnalytics()
      return salesAnalytics
    } catch (error) {
      throw error
    }
  },
  getSalesAnalytics2: async (year1, year2) => {
    try {
      const salesAnalytics = await orderRepository.getSalesAnalytics2(
        year1,
        year2
      )
      return salesAnalytics
    } catch (error) {
      throw error
    }
  },
  returnOrder: async (order_id, return_reason, userId) => {
    try {
      return await orderRepository.PlaceReturnOrder(
        order_id,
        return_reason,
        userId
      )
    } catch (error) {
      throw error
    }
  },
  actions_on_returns: async (status, orderId) => {
    try {
      return await orderRepository.actions_on_returns(status, orderId)
    } catch (error) {
      throw error
    }
  },
  cancelOrder: async (order_id) => {
    try {
      return await orderRepository.cancelOrder(order_id)
    } catch (error) {
      throw error
    }
  },
  checkForValidSessionId: async (sessionId, userId) => {
    try {
      return await orderRepository.checkForValidSessionId(sessionId, userId)
    } catch (error) {
      throw error
    }
  },
  checkOutTheOrder: async (sessionId, userId, addressId) => {
    const transaction = await writerSequelize.transaction()
    try {
      //Calculate the total()
      const userData = await orderRepository.checkIfExistsByID(userId)
      if (!userData) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'User Id is invalid',
        })
      }
      const user_email = userData.email
      const productData = await orderRepository.findAllCartProducts(sessionId)
      let totalAmount = 0
      const productIds = productData.map((cartProduct) => cartProduct.productId)
      const products =
        await orderRepository.findProductAndDiscountDetails(productIds)
      const inventoryUpdates = []
      const orderItemsToCreate = []

      for (let cartProduct of productData) {
        const { productId, quantity } = cartProduct

        const product = products.find((p) => p.id === productId)

        if (product) {
          const price = parseFloat(product.price)

          const seller_sku = product.sellerSku

          const discountPercent =
            product.discounts && product.discounts.discountPercent
              ? parseFloat(product.discounts.discountPercent)
              : 0
          const discountAmount = (price * discountPercent) / 100
          const finalPrice = price - discountAmount

          totalAmount += finalPrice * quantity

          if (product.inventory && product.inventory.quantity >= quantity) {
            product.inventory.quantity -= quantity
            inventoryUpdates.push(product.inventory.save({ transaction }))
          } else {
            // await transaction.rollback();
            throw new CustomError({
              ...HTTP_ERRORS.INTERNAL_SERVER_ERROR,
              errors: 'Not In stock but ordered',
            })
          }
          orderItemsToCreate.push({
            productId: productId,
            quantity: quantity,
            orderItemAmount: finalPrice * quantity,
            sellerSku: seller_sku,
          })
        }
      }
      // Step 1: Update inventory
      await Promise.all(inventoryUpdates)
      // Step 2: Create order
      const formattedTotal = totalAmount.toFixed(2)
      const orderDetailAndItems = await orderRepository.createOrderDetail(
        sessionId,
        userId,
        formattedTotal,
        orderItemsToCreate,
        addressId,
        transaction
      ) //Math round might create problem
      const totalAmountInCents = Math.round(formattedTotal * 100)
      // Step 3: Create Stripe payment intent
      const paymentIntent = await stripe.createPaymentIntent(
        totalAmountInCents,
        userId,
        orderDetailAndItems.id,
        user_email
      )
      const paymentDetails = await orderRepository.createPaymentDetails(
        {
          orderId: orderDetailAndItems.id,
          //amount: formattedTotal,
          //provider: 'stripe',
          status: 'pending',
          paymentId: paymentIntent.id,
          paymentMethod: 'card',
        },
        transaction
      )
      const CLIENT_SECRET = paymentIntent.client_secret
      await transaction.commit()
      return { CLIENT_SECRET, formattedTotal }
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
  myStripeWebhook: async function (hookBody, sig) {
    let event = null
    try {
      event = await stripe.createEvent(hookBody, sig)
    } catch (error) {
      console.log('Check the transaction if it is completed or not')
      throw error
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event)
          break

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event)
          break

        case 'payment_intent.requires_action':
          const requiresActionPaymentIntent = event.data.object
          console.log(
            'PaymentIntent requires additional authentication',
            requiresActionPaymentIntent
          )
          // Handle authentication step, e.g., notify the user to complete authentication
          // await updateOrderStatus(requiresActionPaymentIntent.id, 'requires_action');
          break

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      // Send a response to Stripe to acknowledge receipt of the event
      return { received: true }
    } catch (err) {
      console.error('Error verifying webhook:', err)
      throw err
    }
  },
  listAllFulfillmentOrdersFromDB: async () => {
    try {
      const orders = await orderRepository.listAllFulfillmentOrdersFromDB()
      return orders.map((order) => {
        let frontend_fields = {
          canCancel: false,
        }
        // const canReturn=null;
        if (order.orderCompletionStatus == 'pendingAmazon') {
          frontend_fields.final_status = 'Payment Received but Order is Pending'
        } else if (order.orderCompletionStatus === 'onAmazon') {
          if (order.shipments?.orderCurrentStatus === 'RETURNING') {
            frontend_fields.final_status = 'RETURNING'
          } else if (order.shipments?.orderCurrentStatus === 'RETURNED') {
            frontend_fields.final_status = 'RETURNED'
          } else {
            if (
              ['Received', 'Planning', 'Processing'].includes(
                order.fulfillmentOrderStatus
              )
            ) {
              frontend_fields.canCancel = true
              frontend_fields.final_status = order.fulfillmentOrderStatus
            } else if (order.fulfillmentOrderStatus == 'Complete') {
              if (order.shipments?.orderCurrentStatus != null) {
                frontend_fields.final_status =
                  order.shipments.orderCurrentStatus
              } else {
                frontend_fields.final_status = 'ReadyToShip'
              }
            } else {
              frontend_fields.final_status = order.fulfillmentOrderStatus
            }
          }
        }
        return {
          ...order,
          ...frontend_fields,
        }
      })
    } catch (error) {
      throw error
    }
  },
  getMyOrders: async (userId) => {
    try {
      const orders = await orderRepository.getMyOrders(userId)
      return orders.map((order) => {
        let frontend_fields = {
          canReturn: false,
        }
        // const canReturn=null;
        if (order.orderCompletionStatus == 'pendingAmazon') {
          frontend_fields.final_status = 'Processing Issue'
        } else if (order.orderCompletionStatus === 'onAmazon') {
          if (order.shipments?.orderCurrentStatus === 'RETURNING') {
            frontend_fields.final_status = 'RETURNING'
          } else if (order.shipments?.orderCurrentStatus === 'RETURNED') {
            frontend_fields.final_status = 'RETURNED'
          } else {
            if (
              ['Unfulfillable', 'Invalid'].includes(
                order.fulfillmentOrderStatus
              )
            ) {
              frontend_fields.final_status = 'Unfulfillable'
            } else if (
              ['Received', 'Planning', 'Processing', 'New'].includes(
                order.fulfillmentOrderStatus
              )
            ) {
              frontend_fields.final_status =
                order.fulfillmentOrderStatus === 'New'
                  ? 'Received'
                  : order.fulfillmentOrderStatus
            } else if (order.fulfillmentOrderStatus === 'Complete') {
              if (order.shipments?.orderCurrentStatus != null) {
                frontend_fields.final_status =
                  order.shipments.orderCurrentStatus
                if (frontend_fields.final_status == 'DELIVERED') {
                  frontend_fields.canReturn = true
                }
              } else {
                frontend_fields.final_status = 'Processing'
              }
            } else if (order.fulfillmentOrderStatus == 'Cancelled') {
              frontend_fields.final_status = 'Cancelled'
            }
          }
        }
        return {
          ...order,
          ...frontend_fields,
        }
      })
    } catch (error) {
      throw error
    }
  },
  handlePaymentCanceled: async function (event) {
    try {
      const paymentIntent = event.data.object

      const paymentId = paymentIntent.id
      const payment_method = null
      await orderRepository.updatePaymentStatus(
        paymentId,
        'canceled',
        payment_method
      )
      const orderId = paymentIntent.metadata.user_order_id
      await orderRepository.softDeleteOrder(orderId)
      await orderRepository.updateInventoryForCanceledPayments(orderId)

      //await orderRepository.updatedOrderDetail(orderId, 'failed');

      // Send failure notification email to user
      // const userAccount = await orderRepository.checkIfExistsByID(userId)
      // const emailTitle = 'Payment Canceled'
      // const emailBody = `<p><strong>Sorry!</strong> Your payment was Canceled. Please try again.</p><p>Reason: ${failureMessage}</p>`
      // await queues.addEmailToQueue(
      //   paymentIntent.metadata.user_email,
      //   emailTitle,
      //   emailBody
      // )
    } catch (error) {
      console.error('Error Cancelling payment:', error)
      throw error
    }
  },
  handlePaymentSucceeded: async function (event) {
    try {
      const paymentIntent = event.data.object
      const userId = paymentIntent.metadata.user_id
      const userEmail = paymentIntent.metadata.user_email
      const orderId = paymentIntent.metadata.user_order_id
      const paymentId = paymentIntent.id

      const paymentMethodId = paymentIntent.payment_method
      const amount = paymentIntent.amount_received // Stripe returns amount in cents
      const status = 'succeeded'

      // Update the payment table with the received data
      await orderRepository.updatePaymentTable(
        paymentId,
        orderId,
        paymentMethodId,
        status,
        amount
      )

      // Clear user cart after successful payment
      await orderRepository.updateUserCart(userId)

      // Update the order status to 'accepted' after successful payment
      await orderRepository.updatedOrderDetail(orderId, 'pendingAmazon')
      await queues.orderCreationQueue({ userId, orderId, userEmail: userEmail })

      // Send confirmation email to user
      const emailTitle = 'Payment Confirmation'
      // const emailBody = `<p><strong>Congratulations!</strong> Your Payment was successful.</p>`
      const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        
        <div style="text-align: center; padding-bottom: 20px;">
          <img src=${configs.EMAIL_LOGO_URL} alt="Saikouherbs" style="max-width: 150px;">
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 5px;">
          <h2 style="color: #27ae60; text-align: center;">🎉 Payment Successful!</h2>
          <p style="font-size: 16px; color: #333;">Dear Customer,</p>
          <p style="font-size: 16px; color: #333;">We are pleased to inform you that your payment has been successfully processed.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

          <h3 style="color: #444;">💳 Payment Details:</h3>
          <p><strong>Amount Paid:</strong> $${(paymentIntent.amount / 100).toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${paymentIntent.payment_method_types[0]}</p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

          <p style="font-size: 16px; color: #333;">If you have any questions regarding your order, please contact our support team.</p>

          <div style="text-align: center; margin-top: 20px;">
            <a href=${configs.EMAIL_CONTACT_US_PAGE} style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Contact Support
            </a>
          </div>
        </div>

        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
          Thank you for choosing us! <br> &copy; ${new Date().getFullYear()} YourCompany. All rights reserved.
        </p>

      </div>
    `
      await queues.addEmailToQueue(
        paymentIntent.metadata.user_email,
        emailTitle,
        emailBody
      )

      //await emailService.mailSender(userEmail, emailTitle, emailBody)

      console.log('PaymentIntent succeeded for order ID:', orderId)
    } catch (error) {
      console.error('Error handling payment success:', error)
      throw error
    }
  },
  handlePaymentFailed: async function (event) {
    try {
      const failedPaymentIntent = event.data.object
      const orderId = failedPaymentIntent.metadata.user_order_id
      const paymentId = failedPaymentIntent.id

      const failureMessage = failedPaymentIntent.last_payment_error
        ? failedPaymentIntent.last_payment_error.message
        : 'Unknown error'

      // Update payment table with the failed status and failure message
      await orderRepository.updatePaymentTable(
        paymentId,
        orderId,
        failedPaymentIntent.payment_method,
        'failed',
        0,
        failureMessage
      )

      // Soft delete the order and order items since the payment failed
      await orderRepository.softDeleteOrder(orderId)
      //await orderRepository.updatedOrderDetail(orderId, 'failed');

      // Send failure notification email to user
      // const userAccount = await orderRepository.checkIfExistsByID(userId)
      const emailTitle = 'Payment Failed'
      const emailBody = `<p><strong>Sorry!</strong> Your payment failed. Please try again.</p><p>Reason: ${failureMessage}</p>`
      await queues.addEmailToQueue(
        paymentIntent.metadata.user_email,
        emailTitle,
        emailBody
      )

      console.log('PaymentIntent failed for order ID:', orderId)
    } catch (error) {
      console.error('Error handling payment failure:', error)
      throw error
    }
  },
})

module.exports = orderService
