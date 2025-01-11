const {
  readerDatabase,
  writerDatabase,
  // writerSequelize,
  // readerSequelize,
  // Sequelize,
} = require('../../infra/database/database')
const { Op } = require('sequelize')
const CustomError = require('../../middlewares/error_handler/CustomError')
//   const ERRORS = require('../../middlewares/error_handler/errors/errors')
const HTTP_ERRORS = require('../../middlewares/error_handler/errors/http_errors')

const fetchOrderDetailsForFulfillment = async (orderId, userId) => {
  try {
    const orderDetailModel = await writerDatabase('OrderDetail')
    const orderItemModel = await writerDatabase('OrderItem')
    const userAddressModel = await readerDatabase('Address')
    const orderDetail = await orderDetailModel.findOne({
      where: { id: orderId, userId },
      include: [
        {
          model: userAddressModel,
          as: 'address',
          attributes: [
            'name',
            'addressLine1',
            'addressLine2',
            'city',
            'districtOrCounty',
            'stateOrRegion',
            'postalCode',
            'countryCode',
            'phone',
          ],
        },
        {
          model: orderItemModel,
          as: 'orderItems',
          attributes: [
            'sellerSku',
            'quantity',
            //'orderItemAmount',
            'productId',
          ],
        },
      ],
    })

    if (!orderDetail) {
      throw new CustomError({
        ...HTTP_ERRORS.INTERNAL_SERVER_ERROR,
        errors: `Order with ID ${orderId} for user ${userId} not found`,
      })
    }
    if (!orderDetail.address) {
      throw new CustomError({
        ...HTTP_ERRORS.INTERNAL_SERVER_ERROR,
        errors: `Address for Order ID ${orderId} not found`,
      })
    }

    if (!orderDetail.orderItems || orderDetail.orderItems.length === 0) {
      throw new CustomError({
        ...HTTP_ERRORS.INTERNAL_SERVER_ERROR,
        errors: `Order Items for Order ID ${orderId} not found`,
      })
    }

    // Return the fetched details
    return {
      orderId: orderDetail.id,
      // userId: orderDetail.userId,
      displayableOrderId: orderDetail.id,
      displayableOrderDate: orderDetail.createdAt,
      address: orderDetail.address,
      items: orderDetail.orderItems.map((item) => ({
        sellerSku: item.sellerSku,
        quantity: item.quantity,
        //amount: item.orderItemAmount,
        productId: item.productId,
      })),
    }
  } catch (error) {
    console.error('Error fetching order details for fulfillment:', error)
    throw error
  }
}

const updatedOrderDetail = async (orderId, status) => {
  try {
    const OrderDetail = await writerDatabase('OrderDetail')
    const updatedOrder = await OrderDetail.update(
      { order_status: status },
      { where: { id: orderId } }
    )
    return updatedOrder
  } catch (error) {
    console.error('(CRON)Error updating order status:', error)
    throw new Error('Error updating order status')
  }
}
const bulkUpdateFulfillmentStatus = async (orders) => {
  try {
    const OrderDetailTable = await writerDatabase('OrderDetail')
    let count = 0
    for (const order of orders) {
      count = count + 1
      const { sellerFulfillmentOrderId, fulfillmentOrderStatus } = order
      // Update the order status in the database
      await OrderDetailTable.update(
        {
          fulfillmentOrderStatus,
        },
        {
          where: { id: sellerFulfillmentOrderId },
        }
      )
    }
    return `${count} Order Status has been Updated`
  } catch (error) {
    throw new Error('Error during BULK Updation of fulfillment order status')
  }
}
const getAllOrdersWithIncompleteShipments = async () => {
  try {
    const OrderDetail = await writerDatabase('OrderDetail')
    const FulfillmentShipment = await writerDatabase('FulfillmentShipment')

    // Query orders with status 'Complete' and missing carrierCode, amazonShipmentId, or trackingNumber
    const incompleteShipments = await FulfillmentShipment.findAll({
      where: {
        [Op.or]: [
          { carrierCode: null },
          { amazonShipmentId: null },
          { trackingNumber: null },
          { packageNumber: null },
        ],
      },
      include: [
        {
          model: OrderDetail,
          as: 'fulfillmentShipments',
          attributes: ['id', 'fulfillmentOrderStatus'],
          where: { fulfillmentOrderStatus: 'Complete' },
        },
      ],
    })
    return incompleteShipments
  } catch (error) {
    console.log('(CRON)Error fetching all incomplete shipments orders', error)
  }
}

const updateFulfillmentShipmentTable = async (
  id,
  amazonShipmentId,
  fulfillmentCenterId,
  fulfillmentShipmentStatus,
  //   shippingDate,
  estimatedArrivalDate,
  packageNumber,
  carrierCode,
  trackingNumber
) => {
  try {
    const FulfillmentShipment = await writerDatabase('FulfillmentShipment')
    await FulfillmentShipment.update(
      {
        amazonShipmentId,
        fulfillmentCenterId,
        fulfillmentShipmentStatus,
        //   shippingDate,
        estimatedArrivalDate,
        packageNumber,
        carrierCode,
        trackingNumber,
      },
      { where: { orderId: id } }
    )
  } catch (error) {
    console.error('(CRON)Error fetching all incomplete shipments orders', error)
    throw error
  }
}
const getAllOrdersWithPendingDelivery = async () => {
  try {
    const FulfillmentShipment = await writerDatabase('FulfillmentShipment')
    const orders = await FulfillmentShipment.findAll({
      where: {
        packageNumber: { [Op.ne]: null },
        orderCurrentStatus: {
          [Op.or]: [
            'UNDELIVERABLE',
            'IN_TRANSIT',
            'DELAYED',
            'OUT_FOR_DELIVERY',
            'DELIVERY_ATTEMPTED',
            null,
          ],
        },
      },
    })

    return orders
  } catch (error) {
    console.error('(CRON)Error fetching orders with pending delivery:', error)
    throw error
  }
}
const updateFulfillmentDeliveryStatus = async (
  currentStatus,
  estimatedArrivalDate,
  orderId
) => {
  try {
    const validStatuses = [
      'IN_TRANSIT',
      'DELIVERED',
      'UNDELIVERABLE',
      'DELAYED',
      'OUT_FOR_DELIVERY',
      'DELIVERY_ATTEMPTED',
    ]
    // Check if the current status is valid; otherwise, set it as 'OTHER'
    const deliveryStatus = validStatuses.includes(currentStatus)
      ? currentStatus
      : 'OTHER'

    // Update the FulfillmentShipment table
    const FulfillmentShipment = await writerDatabase('FulfillmentShipment')
    await FulfillmentShipment.update(
      {
        orderCurrentStatus: deliveryStatus,
        estimatedArrivalDate: estimatedArrivalDate || null,
      },
      {
        where: { orderId },
      }
    )
  } catch (error) {
    console.error(
      `(CRON)Error updating delivery status for Order ID: ${orderId}`
    )
    throw error
  }
}

module.exports = {
  fetchOrderDetailsForFulfillment,
  updatedOrderDetail,
  bulkUpdateFulfillmentStatus,
  getAllOrdersWithIncompleteShipments,
  updateFulfillmentShipmentTable,
  getAllOrdersWithPendingDelivery,
  updateFulfillmentDeliveryStatus,
}
