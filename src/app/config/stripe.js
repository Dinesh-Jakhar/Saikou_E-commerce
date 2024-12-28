//Payment Intent
const config = require('./config')

const stripe = require('stripe')(config.STRIPE_SECRET_KEY)

const createPaymentIntent = async (totalAmount, userId, order_id) => {
  try {
    // Create a Payment Intent with the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Convert amount to smallest unit
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        user_id: userId,
        user_order_id: order_id,
      },
    })

    return paymentIntent //.client_secret;
  } catch (error) {
    throw new Error('Failed to create Payment Intent. Please try again later.')
  }
}
const createEvent = async (hookBody, sig) => {
  try {
    const endpointSecret = config.SIGNING_SECRET
    const event = await stripe.webhooks.constructEvent(
      hookBody,
      sig,
      endpointSecret
    )
    return event
  } catch (error) {
    console.log(error)
    throw new Error('Failed to Create Event for Stripe')
  }
}
module.exports = { createPaymentIntent, createEvent }
