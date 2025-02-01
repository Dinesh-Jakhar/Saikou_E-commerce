const { Worker, Queue } = require('bullmq')
const { mailSender } = require('./emailService')
const config = require('./config')
const { createFulfillmentOrder } = require('./sp-api')
const {
  fetchOrderDetailsForFulfillment,
  updatedOrderDetail,
} = require('../utils/requiredFunctions')
const { createClient } = require('redis')

// const queueOptions = { connection: { host: 'localhost', port: 6379 } }

// const emailQueue = new Queue('emailQueue', queueOptions)
// const orderFullfilmentQueue = new Queue('orderFullfilmentQueue', queueOptions)
const MAX_RETRY_ATTEMPTS = 2
let redisConnected = false
let stopServerFunction = null
let emailQueue = null
let orderFullfilmentQueue = null

const setStopServerFunction = (stopServer) => {
  stopServerFunction = stopServer
}

const testRedisConnection = async () => {
  const client = createClient({ socket: { host: 'localhost', port: 6379 } })

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

// const connection = {
//   host: 'localhost',
//   port: 6379,
//   retryStrategy: (times) => {
//     if (redisConnected) return false;
//     // Wait time increases with each retry, max 10 seconds
//     retryAttempts = times;
//     console.log(`Attempting to reconnect to Redis... (Attempt ${times})`);
//     if (times >= MAX_RETRY_ATTEMPTS) {
//       console.error('Maximum Redis retry attempts reached. Shutting down...');
//       shutdownApplication();
//       return false; // Stop retrying
//     }

//     return Math.min(times * 1000, 10000);

//   },
//   maxRetriesPerRequest: null
// };

// Queue configurations with error handling
const createQueue = (name) => {
  if (!redisConnected) {
    console.error(`⚠️ Cannot create queue ${name} as Redis is not connected.`)
    return null
  }
  const queue = new Queue(name, {
    connection: { host: 'localhost', port: 6379 },
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

// let connection = null;
// (async () => {
//   const isConnected = await testRedisConnection();
//   if (isConnected) {
//     connection = { host: 'localhost', port: 6379 };
//     console.log("Redis connection settings initialized.");
//     initializeQueuesAndWorkers();
//   }
// })();

// const initializeQueuesAndWorkers = () => {
//   console.log("✅ Initializing queues and workers...");

//   const createQueue = (name) => {
//     const queue = new Queue(name, { connection });

//     queue.on('error', (error) => {
//       console.error(`Queue ${name} error:`, error);
//     });

//     queue.on('failed', (job, error) => {
//       console.error(`Job ${job.id} in queue ${name} failed:`, error);
//     });

//     queue.on('completed', (job) => {
//       console.log(`Job ${job.id} in queue ${name} completed successfully`);
//     });

//     return queue;
//   };

// }
// const emailQueue = createQueue('emailQueue');
// const orderFullfilmentQueue = createQueue('orderFullfilmentQueue');

//Above

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
    { connection: { host: 'localhost', port: 6379 } }
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
    { connection: { host: 'localhost', port: 6379 } }
  )
  orderFullfilmentWorker.on('completed', async (job) => {
    //console.log(`Order creation completed for Order ID: ${job.data.orderId}`);
    try {
      const emailTitle = 'Order Confirmation'
      const emailBody = `<p>Dear Customer,</p>
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
