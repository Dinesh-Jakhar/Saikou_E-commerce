//Payment Intent
const config = require('./config')
const stripe = require('stripe')(config.STRIPE_SECRET_KEY)

const createPaymentIntent = async (
  totalAmount,
  userId,
  order_id,
  user_email
) => {
  try {
    // Create a Payment Intent with the total amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Convert amount to smallest unit
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        user_id: userId,
        user_order_id: order_id,
        user_email: user_email,
      },
    })

    return paymentIntent //.client_secret;
  } catch (error) {
    throw new Error('Failed to create Payment Intent. Please try again later.')
  }
}

const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Check if the Payment Intent is still pending
    if (
      paymentIntent.status === 'requires_payment_method' ||
      paymentIntent.status === 'requires_confirmation'
    ) {
      // Cancel the Payment Intent
      const canceledPaymentIntent =
        await stripe.paymentIntents.cancel(paymentIntentId)
      console.log(`⚠️ Payment Intent ${paymentIntentId} was canceled.`)

      // Update order status in the database
      // await updatePaymentStatus(paymentIntentId, 'canceled');

      // Notify the user via email
      // await sendExpirationEmail(userEmail, paymentIntentId);

      return canceledPaymentIntent
    } else {
      console.log(
        `✅ Payment Intent ${paymentIntentId} is already processed or not cancellable.`
      )
      return {
        message:
          'Payment Intent is already processed or does not require cancellation.',
      }
    }
  } catch (error) {
    console.error(` Error canceling Payment Intent ${paymentIntentId}:`, error)
    //throw new Error(`Failed to cancel Payment Intent: ${error.message}`);
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
module.exports = { createPaymentIntent, createEvent, cancelPaymentIntent }
