const cron = require('node-cron')
const {
  listAllFulfillmentOrders,
  getFulfillmentOrder,
  fetchTrackingDetails,
} = require('../config/sp-api')
const {
  bulkUpdateFulfillmentStatus,
  getAllOrdersWithIncompleteShipments,
  updateFulfillmentShipmentTable,
  updateFulfillmentDeliveryStatus,
  getAllOrdersWithPendingDelivery,
  getPendingPaymentsFromDB,
} = require('./requiredFunctions')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const { cancelPaymentIntent } = require('../config/stripe')

module.exports = ({
  //   writerSequelize,
  logger,
  //   constants,
  //   writerDatabase,
  //   sleep,
}) => ({
  startCronJob: async function () {
    try {
      // await new Promise((resolve) => setTimeout(resolve, 10000))
      console.log('Cron job started')
      //0 7 * * *
      cron.schedule('0 7 * * *', async () => {
        await sleep(5000)
        console.log('List Fulfillment Order Status CRON Started')
        await this.updateFulfillmentOrderStatus()
      })

      cron.schedule('0 8 * * *', async () => {
        await sleep(3000)
        console.log('get single Fulfillment Order CRON started')
        await this.updateSingleFulfillmentOrderStatus()
      })
      cron.schedule('0 9 * * *', async () => {
        await sleep(2000)
        console.log('update the delivery status CRON started')
        await this.updateDeliveryStatus()
      })
      cron.schedule('0 */2 * * *', async () => {
        await sleep(1000)
        console.log('Canceling the payment intent')
        await this.cancelExpiredPayment()
      })
    } catch (error) {
      logger.error('Cron Job Error')
    }
  },
  updateSingleFulfillmentOrderStatus: async function () {
    try {
      // Get all the Orders from OrderDetail whose status is complete and whose carrierCode or amazonShipmentId or trackingNumber is null in filfillmentShipment Table
      //Then for all the order ids we get, we have to make calls for each of the orderId using getFulfillmentOrder to get the details about the fulfillmentShipments
      //Then update the values which are null

      const incompleteShipments = await getAllOrdersWithIncompleteShipments()
      if (!incompleteShipments || incompleteShipments.length === 0) {
        console.log('No incomplete shipments found.')
        return
      }

      console.log(`Found ${incompleteShipments.length} incomplete shipments.`)

      // Step 2: Loop through each order and fetch details from SP-API
      for (const shipment of incompleteShipments) {
        const { fulfillmentShipments } = shipment // Correctly reference the fulfillmentShipments
        if (!fulfillmentShipments) {
          continue
        }
        const { id } = fulfillmentShipments // Extract orderId from fulfillmentShipments

        try {
          const fulfillmentOrderDetails = await getFulfillmentOrder(id) // SP-API call

          const { fulfillmentShipments } = fulfillmentOrderDetails
          if (!fulfillmentShipments || fulfillmentShipments.length === 0) {
            console.log(`No shipment details found for Order ID: ${id}`)
            continue
          }
          const shipmentDetail = fulfillmentShipments[0]
          const {
            amazonShipmentId,
            fulfillmentCenterId,
            fulfillmentShipmentStatus,
            // shippingDate,
            estimatedArrivalDate,
            fulfillmentShipmentPackage,
          } = shipmentDetail

          // Extract package details (if available)
          const packageDetails = fulfillmentShipmentPackage?.[0] || {}
          const { packageNumber, carrierCode, trackingNumber } = packageDetails

          await updateFulfillmentShipmentTable(
            id,
            amazonShipmentId,
            fulfillmentCenterId,
            fulfillmentShipmentStatus,
            //   shippingDate,
            estimatedArrivalDate,
            packageNumber,
            carrierCode,
            trackingNumber
          )

          //   console.log(
          //     `Updated shipment details for Order ID: ${id}, Shipment ID: ${amazonShipmentId}`
          //   );
          // Extract shipment details

          // console.log(`Updated shipment details for Order ID: ${orderId}`);
        } catch (error) {
          console.error(
            `(CRON)Failed to update shipment details for Order ID: ${id}`
          )
        }
      }
    } catch (error) {
      console.log(error)
      logger.error('Cron Job Error')
    }
  },
  updateFulfillmentOrderStatus: async function () {
    try {
      //Run once in a day
      const fulfillmentOrders = await listAllFulfillmentOrders()
      if (
        !fulfillmentOrders ||
        !fulfillmentOrders.fulfillmentOrders ||
        !fulfillmentOrders.fulfillmentOrders.length
      ) {
        console.log('No fulfillment orders found.')
        return
      }
      const orders = fulfillmentOrders.fulfillmentOrders
      // Loop through each order and update the status
      await bulkUpdateFulfillmentStatus(orders)
      //Fetch all the orders using the list All Fulfillment Orders
      // Then update the status for all the orders
    } catch (error) {
      logger.error('Cron Job Error update fulfilment')
    }
  },
  updateDeliveryStatus: async function () {
    try {
      console.log('Fetching orders with trackable statuses...')
      const allValidOrders = await getAllOrdersWithPendingDelivery()
      if (!allValidOrders || allValidOrders.length === 0) {
        console.log('No orders found for delivery status update.')
        return
      }
      for (const order of allValidOrders) {
        const { packageNumber, orderId } = order
        try {
          // Call SP-API Tracking Endpoint
          const trackingDetails = await fetchTrackingDetails(packageNumber) // Assuming fetchTrackingDetails is implemented

          if (!trackingDetails || !trackingDetails.currentStatus) {
            continue
          }
          const { currentStatus, estimatedArrivalDate } = trackingDetails
          // Step 3: Update the FulfillmentShipment table
          await updateFulfillmentDeliveryStatus(
            currentStatus,
            estimatedArrivalDate,
            orderId
          )
        } catch (error) {
          console.error(
            `Failed to update delivery status for package: ${packageNumber}`,
            error
          )
        }
      }
      //
    } catch (error) {
      console.log(error)
      logger.error('Cron Job Error in updateDelivery Status')
    }
  },
  cancelExpiredPayment: async function () {
    try {
      const EXPIRATION_TIME = 10 * 60 * 1000
      const now = Date.now()
      const pendingPayments = await getPendingPaymentsFromDB()
      if (pendingPayments && pendingPayments.length > 0) {
        for (const payment of pendingPayments) {
          const paymentAge = now - payment.createdAt
          if (paymentAge > EXPIRATION_TIME) {
            try {
              const payment_intent_id = payment.paymentId
              await cancelPaymentIntent(payment_intent_id)
            } catch (error) {
              console.error(
                `Error canceling Payment Intent ${payment.payment_intent_id}:`,
                error
              )
            }
          }
        }
      }
    } catch (error) {
      console.log(error)
      logger.error('Cron Job Error in cancelExpiredPayment')
    }
  },
})
