const { Worker, Queue } = require('bullmq')
const { mailSender } = require('./emailService')
const config = require('./config')
const { createFulfillmentOrder } = require('./sp-api')
const {
  fetchOrderDetailsForFulfillment,
  updatedOrderDetail,
} = require('../utils/requiredFunctions')
const queueOptions = { connection: { host: 'localhost', port: 6379 } }

const emailQueue = new Queue('emailQueue', queueOptions)
const orderFullfilmentQueue = new Queue('orderFullfilmentQueue', queueOptions)

const addEmailToQueue = async (userEmail, title, body) => {
  try {
    await emailQueue.add('sendEmail', {
      userEmail,
      title,
      body,
    })
  } catch (error) {
    console.log(error)
    throw error
  }
}

const orderCreationQueue = async (orderDetails) => {
  try {
    await orderFullfilmentQueue.add('createFBAOrder', orderDetails)
    // console.log(
    //   `Order creation job added to queue for Order ID: ${orderDetails.orderId}`
    // )
  } catch (error) {
    console.log(error)
    throw error
  }
}

//WORKERS

//Worker-1
const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    try {
      //console.log(`Processing email for ${job.data.userEmail}`)

      // Send email
      const result = await mailSender(
        job.data.userEmail,
        job.data.subject,
        job.data.body
      )

      // Final progress update and return value
      // console.log(`Email sent to ${job.data.userEmail}`)
    } catch (error) {
      console.error(`Failed to send email to ${job.data.userEmail}:`, error)
      throw error
    }
  },
  queueOptions
)

//Worker-2
const orderFullfilmentWorker = new Worker(
  'orderFullfilmentQueue',
  async (job) => {
    try {
      //console.log(`Processing order creation for Order ID: ${job.data.orderId}`);

      const orderDetails = await fetchOrderDetailsForFulfillment(
        job.data.orderId,
        job.data.userId
      )
      // console.log('Order Details:', JSON.stringify(orderDetails, null, 2));

      if (!orderDetails || !orderDetails.address || !orderDetails.items) {
        throw new Error(
          `Incomplete order details for Order ID: ${job.data.orderId}`
        )
      }
      // Call SP-API to create the order
      await createFulfillmentOrder({
        sellerFulfillmentOrderId: orderDetails.orderId,
        displayableOrderId: orderDetails.displayableOrderId,
        displayableOrderDate: orderDetails.displayableOrderDate,
        displayableOrderComment: 'Thank you for your purchase!',
        shippingSpeedCategory: 'Standard',
        destinationAddress: {
          name: orderDetails.address.name,
          addressLine1: orderDetails.address.addressLine1,
          addressLine2: orderDetails.address.addressLine2,
          city: orderDetails.address.city,
          districtOrCounty: orderDetails.address.districtOrCounty,
          stateOrRegion: orderDetails.address.stateOrRegion,
          postalCode: orderDetails.address.postalCode,
          countryCode: orderDetails.address.countryCode,
          phoneNumber: orderDetails.address.phone,
        },
        fulfillmentAction: 'Hold',
        fulfillmentPolicy: 'FillOrKill',
        notificationEmails: job.data.userEmail,
        items: orderDetails.items,
      })

      //console.log(`FBA Order created successfully for Order ID: ${job.data.orderId}`);
      await updatedOrderDetail(job.data.orderId, 'onAmazon')
    } catch (error) {
      console.error(
        `Failed to create FBA order for Order ID: ${job.data.orderId}`,
        error
      )
      throw error // Retry based on job attempts
    }
  },
  queueOptions
)

orderFullfilmentWorker.on('completed', async (job) => {
  //console.log(`Order creation completed for Order ID: ${job.data.orderId}`);
  try {
    const emailTitle = 'Order Confirmation'
    const emailBody = `<p>Dear ${job.data.userName},</p>
                           <p>Your order <strong>${job.data.orderId}</strong> has been successfully processed.</p>
                           <p>Thank you for choosing us!</p>`

    await mailSender(job.data.userEmail, emailTitle, emailBody)
    //Update the database status to onAmazon
    //console.log(`Confirmation email queued for ${job.data.userEmail}`);
  } catch (error) {
    console.error(
      `Failed to send confirmation email to user for Order ID: ${job.data.orderId}`,
      error
    )
    throw error
  }
})

orderFullfilmentWorker.on('failed', async (job, err) => {
  console.error(`Order creation failed for Order ID: ${job.data.orderId}:`, err)
  try {
    const adminEmail = config.ADMIN_EMAIL
    const emailTitle = 'Order Creation Failed'
    const emailBody = `<p>Order ID: <strong>${job.data.orderId}</strong> failed to be processed.</p>
                           <p>Error Details:</p>
                           <pre>${err.stack || err.message}</pre>`

    await mailSender(adminEmail, emailTitle, emailBody)
    //await addEmailToQueue(adminEmail, emailTitle, emailBody);
    console.log(`Failure notification queued for Order ID: ${job.data.orderId}`)
  } catch (error) {
    console.error(
      `Failed to notify admin for failed Order ID: ${job.data.orderId}`,
      error
    )
    throw error
  }
})

module.exports = { addEmailToQueue, orderCreationQueue }
