const { Worker, Queue } = require('bullmq')
const { mailSender } = require('./emailService')
const queueOptions = { connection: { host: 'localhost', port: 6379 } }

const emailQueue = new Queue('emailQueue', queueOptions)
const orderFulfillmentQueue = new Queue('orderFulfillmentQueue', queueOptions)

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
    await orderQueue.add('createFBAOrder', orderDetails, {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    })
    console.log(
      `Order creation job added to queue for Order ID: ${orderDetails.orderId}`
    )
  } catch (error) {
    console.log(error)
    throw error
  }
}

//WORKERS

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    try {
      console.log(`Processing email for ${job.data.userEmail}`)

      await job.updateProgress(50)

      // Send email
      const result = await mailSender(
        job.data.userEmail,
        job.data.subject,
        job.data.body
      )

      // Final progress update and return value
      await job.updateProgress(100)
      console.log(`Email sent to ${job.data.userEmail}`)
      console.log(result)
    } catch (error) {
      console.error(`Failed to send email to ${job.data.userEmail}:`, error)
      throw error
    }
  },
  queueOptions
)

module.exports = { addEmailToQueue, orderCreationQueue }
