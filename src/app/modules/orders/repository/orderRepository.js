const orderRepository = ({
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
    addressId,
    transaction
  ) => {
    try {
      const orderDetailModel = await writerDatabase('OrderDetail')
      const OrderItemModel = await writerDatabase('OrderItem')
      const fulfillmentOrderModel = await writerDatabase('FulfillmentShipment')
      const addressModel = await writerDatabase('Address') // Fetch address model
      const orderAddressModel = await writerDatabase('OrderAddress') // Fetch OrderAddress model

      const lastOrder = await orderDetailModel.findOne({
        order: [['createdAt', 'DESC']],
        transaction,
      })
      const lastOrderNumber = lastOrder
        ? parseInt(lastOrder.id.replace('#ORDER-', '')) + 1
        : 678

      const orderId = `#ORDER-${String(lastOrderNumber).padStart(4, '0')}`

      const address = await addressModel.findOne({
        where: { id: addressId },
        transaction,
      })
      if (!address) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Address ID not found',
        })
      }
      const orderDetail = await orderDetailModel.create(
        {
          id: orderId,
          userId: userId,
          total: totalAmount,
          // addressId: addressId,
          order_status: 'pending',
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
      await fulfillmentOrderModel.create(
        {
          orderId,
        },
        {
          transaction,
        }
      )
      await orderAddressModel.create(
        {
          orderId: orderDetail.id,
          name: address.name,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          districtOrCounty: address.districtOrCounty,
          stateOrRegion: address.stateOrRegion,
          postalCode: address.postalCode,
          countryCode: address.countryCode,
          phone: address.phone,
        },
        {
          transaction,
        }
      )

      return orderDetail
    } catch (error) {
      throw error
    }
  },
  getMyOrders: async (userId) => {
    try {
      const orderDetailModel = await readerDatabase('OrderDetail')
      const paymentDetailsModel = await readerDatabase('PaymentDetails')
      const orderItemModel = await readerDatabase('OrderItem')
      const productModel = await readerDatabase('Product')
      const orderAddressModel = await readerDatabase('OrderAddress')
      const fulfillmentShipmentModel = await readerDatabase(
        'FulfillmentShipment'
      )
      const orders = await orderDetailModel.findAll({
        where: {
          userId,
          order_status: ['pendingAmazon', 'onAmazon'], // Filter by order_status
        },
        include: [
          {
            model: paymentDetailsModel,
            as: 'paymentDetails',
            where: { status: 'succeeded' }, // Only orders with succeeded payment
            attributes: ['amount'],
          },
          {
            model: orderItemModel,
            as: 'orderItems',
            attributes: ['quantity', 'orderItemAmount', 'productId'],
            include: [
              {
                model: productModel,
                as: 'product', // Assuming the alias is 'product' for OrderItem -> Product relation
                attributes: ['name', 'imageUrls'], // Fetch product name and image
              },
            ],
          },
          {
            model: orderAddressModel,
            as: 'orderAddress',
            attributes: [
              'name',
              'addressLine1',
              'addressLine2',
              'city',
              'stateOrRegion',
              'districtOrCounty',
              'postalCode',
              'countryCode',
              'phone',
            ],
          },
          {
            model: fulfillmentShipmentModel,
            as: 'fulfillmentShipments',
            attributes: [
              'carrierCode',
              'trackingNumber',
              'orderCurrentStatus',
              'estimatedArrivalDate',
            ],
          },
        ],
        attributes: [
          'id',
          'createdAt',
          'total',
          'order_status',
          'fulfillmentOrderStatus',
        ], // Attributes from OrderDetail
      })

      // Format the result for better readability
      return orders.map((order) => ({
        orderId: order.id,
        createdAt: order.createdAt,
        totalAmount: order.total,
        orderCompletionStatus: order.order_status,
        fulfillmentOrderStatus: order.fulfillmentOrderStatus,
        payment: order.paymentDetails,
        deliveryAddress: order.orderAddress,
        items: order.orderItems.map((item) => ({
          quantity: item.quantity,
          orderItemAmount: item.orderItemAmount,
          product: item.product,
        })),
        shipments: order.fulfillmentShipments,
      }))
    } catch (error) {
      throw error
    }
  },
  listAllFulfillmentOrdersFromDB: async () => {
    try {
      const orderDetailModel = await readerDatabase('OrderDetail')
      const paymentDetailsModel = await readerDatabase('PaymentDetails')
      const orderItemModel = await readerDatabase('OrderItem')
      const productModel = await readerDatabase('Product')
      const orderAddressModel = await readerDatabase('OrderAddress')
      const userModel = await readerDatabase('User')
      const fulfillmentShipmentModel = await readerDatabase(
        'FulfillmentShipment'
      )
      const orders = await orderDetailModel.findAll({
        where: {
          order_status: ['pendingAmazon', 'onAmazon'], // Filter by order_status
        },
        include: [
          {
            model: userModel,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: paymentDetailsModel,
            as: 'paymentDetails',
            where: { status: 'succeeded' }, // Only orders with succeeded payment
            attributes: ['amount', 'paymentConfirmationTimestamp'],
          },
          {
            model: orderItemModel,
            as: 'orderItems',
            attributes: ['quantity', 'orderItemAmount', 'productId'],
            include: [
              {
                model: productModel,
                as: 'product', // Assuming the alias is 'product' for OrderItem -> Product relation
                attributes: ['name', 'imageUrls'], // Fetch product name and image
              },
            ],
          },
          {
            model: orderAddressModel,
            as: 'orderAddress',
            attributes: [
              'name',
              'addressLine1',
              'addressLine2',
              'city',
              'stateOrRegion',
              'districtOrCounty',
              'postalCode',
              'countryCode',
              'phone',
            ],
          },
          {
            model: fulfillmentShipmentModel,
            as: 'fulfillmentShipments',
            attributes: [
              'carrierCode',
              'trackingNumber',
              'orderCurrentStatus',
              'fulfillmentShipmentStatus',
              'estimatedArrivalDate',
            ],
          },
        ],
        attributes: [
          'id',
          'createdAt',
          'total',
          'order_status',
          'fulfillmentOrderStatus',
        ], // Attributes from OrderDetail
      })
      // Format the result for better readability
      return orders.map((order) => ({
        orderId: order.id,
        createdAt: order.createdAt,
        totalAmount: order.total,
        orderCompletionStatus: order.order_status,
        fulfillmentOrderStatus: order.fulfillmentOrderStatus,
        user: order.user
          ? {
              id: order.user.id,
              name: `${order.user.firstName} ${order.user.lastName || ''}`.trim(),
              email: order.user.email,
              // If phoneNumber is not in the User model, remove this field or update the model.
              // phoneNumber: order.user.phoneNumber || null,
            }
          : null,
        payment: order.paymentDetails,
        deliveryAddress: order.orderAddress,
        items: order.orderItems.map((item) => ({
          quantity: item.quantity,
          orderItemAmount: item.orderItemAmount,
          product: item.product,
        })),
        shipments: order.fulfillmentShipments,
      }))
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

module.exports = orderRepository
