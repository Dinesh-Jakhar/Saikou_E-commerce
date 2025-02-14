const { cancelFulfillmentOrder } = require('../../../config/sp-api')
const { Op, fn, col } = require('sequelize')

const orderRepository = ({
  writerDatabase,
  readerDatabase,
  CustomError,
  HTTP_ERRORS,
  configs,
}) => ({
  checkForValidSessionId: async (sessionId, userId) => {
    try {
      const sessionModel = await readerDatabase('ShoppingSession')
      const session = await sessionModel.findOne({
        where: {
          id: sessionId,
          userId,
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
  PlaceReturnOrder: async (order_id, return_reason, userId) => {
    try {
      const orderDetailModel = await readerDatabase('OrderDetail')
      const fulfillmentOrderModel = await writerDatabase('FulfillmentShipment')
      const checkForValidOrders = await orderDetailModel.findOne({
        where: { id: order_id, userId },
      })
      if (!checkForValidOrders) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'No Such Order Exists',
        })
      }
      const fulfillmentRecord = await fulfillmentOrderModel.findOne({
        where: { orderId: order_id, orderCurrentStatus: 'DELIVERED' },
      })

      if (!fulfillmentRecord) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Order is not eligible for return. It must be delivered.',
        })
      } else {
        fulfillmentRecord.retrun_reason = return_reason
        fulfillmentRecord.orderCurrentStatus = 'RETURNING'
        await fulfillmentRecord.save()
      }
      return fulfillmentRecord
    } catch (error) {
      throw error
    }
  },
  actions_on_returns: async (status, orderId) => {
    try {
      const fulfillmentOrderModel = await writerDatabase('FulfillmentShipment')
      const fulfillmentRecord = await fulfillmentOrderModel.findOne({
        where: {
          orderCurrentStatus: 'RETURNING',
          orderId,
        },
      })
      if (!fulfillmentRecord) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Order is not eligible for returns.',
        })
      }
      const final_status = status === 'Approv' ? 'RETURNED' : 'RETURN_REJECTED'
      fulfillmentRecord.orderCurrentStatus = final_status
      await fulfillmentRecord.save()
      return `${status}ed`
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
  cancelOrder: async (order_id) => {
    try {
      const orderDetailModel = await writerDatabase('OrderDetail')
      const fulfillmentShipmentModel = await writerDatabase(
        'FulfillmentShipment'
      )
      const the_order = await orderDetailModel.findOne({
        where: {
          id: order_id,
          fulfillmentOrderStatus: {
            [Op.in]: ['Received', 'Planning', 'Processing'],
          },
        },
      })
      if (!the_order) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'No Order Found To Cancel',
        })
      }

      const response = await cancelFulfillmentOrder(order_id)
      // console.log("Amazon SP-API Cancel Response:", response);

      await fulfillmentShipmentModel.update(
        {
          orderCurrentStatus: null,
          // fulfillmentShipmentStatus: null,
        },
        { where: { orderId: order_id } }
      )

      await orderDetailModel.update(
        { fulfillmentOrderStatus: 'Cancelled' },
        { where: { id: order_id } }
      )
      return { message: 'Order successfully cancelled' }
    } catch (error) {
      throw error
    }
  },
  getSalesAnalytics: async () => {
    try {
      const orderDetailModel = await readerDatabase('OrderDetail')
      const orderItemModel = await readerDatabase('OrderItem')
      const paymentDetailsModel = await readerDatabase('PaymentDetails')
      const userModel = await readerDatabase('User')

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Get the start of the current week (Monday)
      const startOfWeek = new Date(today)
      const dayOfWeek = today.getDay()
      if (dayOfWeek !== 1) {
        // If today is not Monday, move back to last Monday
        startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
      }

      startOfWeek.setHours(0, 0, 0, 0)

      // Get the start of the current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      startOfMonth.setHours(0, 0, 0, 0)
      const totalRevenue = await paymentDetailsModel.sum('amount', {
        where: { status: 'succeeded' },
      })

      const totalOrders = await orderDetailModel.count({
        where: {
          order_status: {
            [Op.in]: ['pendingAmazon', 'onAmazon'],
          },
        },
      })
      const todaysOrders = await orderDetailModel.count({
        where: {
          order_status: {
            [Op.in]: ['pendingAmazon', 'onAmazon'],
          },
          createdAt: {
            [Op.eq]: today,
          },
        },
      })

      const validOrderIds = await orderDetailModel.findAll({
        attributes: ['id'],
        where: {
          order_status: {
            [Op.in]: ['pendingAmazon', 'onAmazon'],
          },
        },
        raw: true, // Returns only the data, not Sequelize instances
      })

      // Step 2: Extract order IDs into an array
      const orderIds = validOrderIds.map((order) => order.id)

      if (orderIds.length === 0) {
        totalUnitsSold = 0 // No valid orders, so no units sold
      } else {
        // Step 3: Calculate total quantity sold from OrderItem linked to valid orders
        totalUnitsSold =
          (await orderItemModel.sum('quantity', {
            where: {
              orderId: {
                [Op.in]: orderIds,
              },
            },
          })) || 0
      }

      const weeklySales = await paymentDetailsModel.sum('amount', {
        where: {
          status: 'succeeded',
          createdAt: {
            [Op.gte]: startOfWeek,
          },
        },
      })

      const monthlySales = await paymentDetailsModel.sum('amount', {
        where: {
          status: 'succeeded',
          createdAt: {
            [Op.gte]: startOfMonth,
          },
        },
      })

      const totalUsers = await userModel.count()

      return {
        totalRevenue: totalRevenue || 0,
        todaysOrders,
        totalOrders,
        totalUnitsSold: totalUnitsSold || 0,
        weeklySales: weeklySales || 0,
        monthlySales: monthlySales || 0,
        totalUsers,
      }
    } catch (error) {
      throw error
    }
  },
  getSalesAnalytics2: async (selectedYear1, selectedYear2) => {
    try {
      const [
        orderDetailModel,
        orderItemModel,
        paymentDetailsModel,
        productModel,
        fulfillmentShipmentModel,
      ] = await Promise.all([
        readerDatabase('OrderDetail'),
        readerDatabase('OrderItem'),
        readerDatabase('PaymentDetails'),
        readerDatabase('Product'),
        readerDatabase('FulfillmentShipment'),
      ])

      const validOrderIds = await orderDetailModel.findAll({
        attributes: ['id'],
        where: {
          order_status: { [Op.not]: 'pending' },
          fulfillmentOrderStatus: {
            [Op.or]: [{ [Op.not]: ['Cancelled'] }, { [Op.is]: null }],
          },
          id: {
            [Op.in]: (
              await paymentDetailsModel.findAll({
                attributes: ['orderId'],
                where: { status: 'succeeded' },
                raw: true,
              })
            ).map((entry) => entry.orderId),
          },
        },
        include: [
          {
            model: fulfillmentShipmentModel,
            as: 'fulfillmentShipments',
            attributes: [],
            required: false,
            where: {
              orderCurrentStatus: {
                [Op.or]: [{ [Op.not]: ['RETURNED'] }, { [Op.is]: null }],
              },
            },
          },
        ],
        raw: true,
      })

      const orderIds = validOrderIds.map((entry) => entry.id)
      const getUnitsPerMonth = async (year) => {
        const unitsPerMonth = await orderItemModel.findAll({
          attributes: [
            [fn('MONTH', col('OrderDetail.created_at')), 'month'],
            'productId',
            [fn('sum', col('quantity')), 'totalUnits'],
          ],
          include: [
            {
              model: orderDetailModel,
              as: 'orderDetail',
              attributes: [],
              where: {
                id: { [Op.in]: orderIds },
                createdAt: {
                  [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
                },
              },
            },
          ],
          group: [col('month'), col('productId')],
          raw: true,
        })
        const unitsByMonth = {}

        for (const entry of unitsPerMonth) {
          const { month, productId, totalUnits } = entry

          // Fetch product name
          const product = await productModel.findOne({
            attributes: ['name'],
            where: { id: productId },
            raw: true,
          })

          if (product) {
            const productName = product.name
            if (!unitsByMonth[`Month-${month}`]) {
              unitsByMonth[`Month-${month}`] = {}
            }
            unitsByMonth[`Month-${month}`][productName] =
              (unitsByMonth[`Month-${month}`][productName] || 0) +
              Number(totalUnits)
          }
        }

        return unitsByMonth
      }

      // Function to get revenue per product per month for a given year
      const getRevenuePerProductMonth = async (year) => {
        const revenuePerMonth = await paymentDetailsModel.findAll({
          attributes: [
            [fn('MONTH', col('created_at')), 'month'],
            'orderId',
            [fn('sum', col('amount')), 'totalRevenue'],
          ],
          where: {
            status: 'succeeded',
            orderId: { [Op.in]: orderIds },
            createdAt: {
              [Op.between]: [new Date(year, 0, 1), new Date(year, 11, 31)],
            },
          },
          group: ['month', 'orderId'],
          raw: true,
        })

        // Map revenue per month to products
        const revenueByProductMonth = {}
        for (const entry of revenuePerMonth) {
          const { month, orderId, totalRevenue } = entry
          const productEntry = await orderItemModel.findOne({
            attributes: ['productId'],
            where: { orderId },
            raw: true,
          })

          if (productEntry) {
            const { productId } = productEntry
            const product = await productModel.findOne({
              attributes: ['id', 'name'],
              where: { id: productId },
              raw: true,
            })

            if (product) {
              if (!revenueByProductMonth[product.name]) {
                revenueByProductMonth[product.name] = {}
              }
              revenueByProductMonth[product.name][`Month-${month}`] =
                (revenueByProductMonth[product.name][`Month-${month}`] || 0) +
                Number(totalRevenue)
            }
          }
        }
        return revenueByProductMonth
      }

      // Fetch both results in parallel
      const [noOfUnits_vs_products, revenue_vs_month] = await Promise.all([
        getUnitsPerMonth(selectedYear1),
        getRevenuePerProductMonth(selectedYear2),
      ])

      return { noOfUnits_vs_products, revenue_vs_month }
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
        paranoid: false,
        transaction,
      })
      const lastOrderNumber = lastOrder
        ? parseInt(lastOrder.id.replace('#ORDER-', '')) + 1
        : 678

      const orderId = `#ORDER-${String(lastOrderNumber).padStart(4, '0')}`

      const address = await addressModel.findOne({
        where: { id: addressId, userId },
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
      const baseUrl = configs.SERVER_IMAGE_URL
      const orders = await orderDetailModel.findAll({
        where: {
          userId,
          order_status: ['pendingAmazon', 'onAmazon'], // Filter by order_status
        },
        order: [['createdAt', 'DESC']],
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
                attributes: ['id', 'name', 'desc', 'imageUrls'], // Fetch product name and image
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
          product: {
            id: item.product.id,
            name: item.product.name,
            desc: item.product.desc,
            imageUrls: (item.product.imageUrls || []).map(
              (image) => `${baseUrl}${image}`
            ),
          },
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
        order: [['createdAt', 'DESC']],
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
                attributes: ['id', 'name', 'desc', 'imageUrls'], // Fetch product name and image
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
      const baseUrl = configs.SERVER_IMAGE_URL
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
          product: {
            id: item.product.id,
            name: item.product.name,
            desc: item.product.desc,
            imageUrls: (item.product.imageUrls || []).map(
              (image) => `${baseUrl}${image}`
            ),
          },
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
      const FulfillmentShipmentTable = await writerDatabase(
        'FulfillmentShipment'
      )
      const OrderAddressTable = await writerDatabase('OrderAddress')
      await OrderAddressTable.destroy({
        where: { orderId },
      })
      await FulfillmentShipmentTable.destroy({
        where: { orderId },
      })
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
  updatePaymentStatus: async (paymentIntentId, status, payment_method) => {
    try {
      const paymentDetailsModel = await writerDatabase('PaymentDetails')
      const Payments = await paymentDetailsModel.update(
        {
          status: status,
          paymentMethod: payment_method,
        },
        {
          where: { paymentId: paymentIntentId },
        }
      )
      return Payments
    } catch (error) {
      throw error
    }
  },
  updateInventoryForCanceledPayments: async (orderId) => {
    try {
      const OrderDetail = await readerDatabase('OrderDetail')
      const OrderItem = await readerDatabase('OrderItem')
      const Inventory = await writerDatabase('Inventory')

      const order = await OrderDetail.findOne({
        where: { id: orderId },
        include: [{ model: OrderItem, as: 'orderItems', paranoid: false }],
        paranoid: false,
      })
      if (!order) {
        console.log(`No failed order found with ID: ${orderId}`)
        return
      }
      for (const item of order.orderItems) {
        const inventoryRecord = await Inventory.findOne({
          where: { productId: item.productId },
        })
        if (inventoryRecord) {
          inventoryRecord.quantity += item.quantity
          await inventoryRecord.save()
        } else {
          console.error(
            `Inventory record not found for Product ID: ${item.productId}`
          )
        }
      }
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
