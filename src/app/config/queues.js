const { Worker, Queue } = require('bullmq')
const { mailSender } = require('./emailService')
const config = require('./config')
const { createFulfillmentOrder } = require('./sp-api')
const {
  fetchOrderDetailsForFulfillment,
  updatedOrderDetail,
} = require('../utils/requiredFunctions')
const { createClient } = require('redis')

const MAX_RETRY_ATTEMPTS = 2
let redisConnected = false
let stopServerFunction = null
let emailQueue = null
let orderFullfilmentQueue = null

const setStopServerFunction = (stopServer) => {
  stopServerFunction = stopServer
}

const testRedisConnection = async () => {
  const client = createClient({
    socket: {
      host: config.REDIS_HOST || '127.0.0.1',
      port: config.REDIS_PORT || 6379,
    },
  })

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      await client.connect()
      console.log('Redis server started successfully')
      redisConnected = true
      await client.quit()
      return true
    } catch (error) {
      console.error(
        `Redis connection attempt ${attempt} failed: ${error.message}`
      )

      if (attempt === MAX_RETRY_ATTEMPTS) {
        console.error('Maximum Redis retry attempts reached. Shutting down...')
        shutdownApplication()
        return false
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

// Queue configurations with error handling
const createQueue = (name) => {
  if (!redisConnected) {
    console.error(`⚠️ Cannot create queue ${name} as Redis is not connected.`)
    return null
  }
  const queue = new Queue(name, {
    connection: {
      host: config.REDIS_HOST || '127.0.0.1',
      port: config.REDIS_PORT || 6379,
    },
  })

  queue.on('error', (error) => {
    console.error(`Queue ${name} error:`, error)
  })

  queue.on('failed', (job, error) => {
    console.error(`Job ${job.id} in queue ${name} failed:`, error)
  })

  queue.on('completed', (job) => {
    console.log(`Job ${job.id} in queue ${name} completed successfully`)
  })

  return queue
}

//WORKERS
const initializeWorkers = () => {
  if (!redisConnected) {
    console.error('❌ Redis is not connected. Skipping worker initialization.')
    return
  }
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
    {
      connection: {
        host: config.REDIS_HOST || '127.0.0.1',
        port: config.REDIS_PORT || 6379,
      },
    }
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
    {
      connection: {
        host: config.REDIS_HOST || '127.0.0.1',
        port: config.REDIS_PORT || 6379,
      },
    }
  )
  orderFullfilmentWorker.on('completed', async (job) => {
    //console.log(`Order creation completed for Order ID: ${job.data.orderId}`);
    try {
      const emailTitle = 'Order Confirmation'

      const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            
            <div style="text-align: center; padding-bottom: 20px;">
              <img src=${config.EMAIL_LOGO_URL} alt="Saikouherbs" style="max-width: 150px;">
            </div>

            <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; padding: 20px;">
              <h2 style="color: #27ae60; text-align: center;">✅ Order Confirmed!</h2>
              <p style="font-size: 16px; color: #333;">Dear Customer,</p>
              <p style="font-size: 16px; color: #333;">Your order <strong>#${job.data.orderId}</strong> has been successfully processed. 🎉</p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

              <h3 style="color: #444;">📦 Order Details:</h3>
              <p><strong>Order ID:</strong> ${job.data.orderId}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Payment Status:</strong> Confirmed ✅</p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

              <p style="font-size: 16px; color: #333;">You can track your order status using the button below:</p>

            </div>

            <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
              Thank you for shopping with us! <br> &copy; ${new Date().getFullYear()} Saikouherbs. All rights reserved.
            </p>

            <p style="color: #777; font-size: 14px; text-align: center;">
              Need help? Contact us at <a href=${config.ADMIN_EMAIL}>customercare@saikouherbs.com</a>
            </p>

          </div>
        `

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
    console.error(
      `Order creation failed for Order ID: ${job.data.orderId}:`,
      err
    )
    try {
      const adminEmail = config.ADMIN_EMAIL
      const emailTitle = 'Order Creation Failed'
      const emailBody = `<p>Order ID: <strong>${job.data.orderId}</strong> failed to be processed.</p>
                           <p>Error Details:</p>
                           <pre>${err.stack || err.message}</pre>`

      await mailSender(adminEmail, emailTitle, emailBody)
      //await addEmailToQueue(adminEmail, emailTitle, emailBody);
      console.log(
        `Failure notification queued for Order ID: ${job.data.orderId}`
      )
    } catch (error) {
      console.error(
        `Failed to notify admin for failed Order ID: ${job.data.orderId}`,
        error
      )
      throw error
    }
  })
}

const initializeQueuesAndWorkers = async () => {
  const isConnected = await testRedisConnection()
  if (isConnected) {
    console.log('✅ Redis connection settings initialized.')
    emailQueue = createQueue('emailQueue')
    orderFullfilmentQueue = createQueue('orderFullfilmentQueue')
    initializeWorkers()
  }
}

// ✅ Call function to start queues & workers
initializeQueuesAndWorkers()

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

const closeQueues = async () => {
  await Promise.all([emailQueue.close(), orderFullfilmentQueue.close()])
  console.log('Queues closed successfully')
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queues...')
  await closeQueues()
  process.exit(0)
})
const shutdownApplication = async () => {
  console.log(
    'Initiating application shutdown due to Redis connection failures...'
  )

  try {
    // First close all queues and workers
    if (emailQueue) {
      await emailQueue.close()
    }
    if (orderFullfilmentQueue) {
      await orderFullfilmentQueue.close()
    }

    // Then stop the main server if stopServer function is available
    if (stopServerFunction) {
      await stopServerFunction()
    } else {
      console.error('stopServer function not set, exiting process directly')
      process.exit(1)
    }
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
}

module.exports = {
  addEmailToQueue,
  orderCreationQueue,
  closeQueues,
  setStopServerFunction,
}
