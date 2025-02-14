const SellingPartner = require('amazon-sp-api')
const config = require('./config')

let spClient = null

// SP-API Configuration
const spConfig = {
  region: config.SP_API_REGION,
  refresh_token: config.SP_API_REFRESH_TOKEN,
  credentials: {
    SELLING_PARTNER_APP_CLIENT_ID: config.SP_API_CLIENT_ID,
    SELLING_PARTNER_APP_CLIENT_SECRET: config.SP_API_CLIENT_SECRET,
  },
  options: {
    auto_request_tokens: true, // Automatically refresh tokens
    use_sandbox: false, // Set true for sandbox testing
    debug_log: false,
  },
}

// Initialize SP-API Client
async function initSPClient() {
  if (!spClient) {
    try {
      spClient = new SellingPartner(spConfig)
      console.log('SP-API Client Initialized')
    } catch (error) {
      console.error('Failed to initialize SP-API client:', error)
      throw error
    }
  }
  return spClient
}

// Fetch All Fulfillment Orders
async function listAllFulfillmentOrders() {
  const client = await initSPClient()
  try {
    const response = await client.callAPI({
      operation: 'listAllFulfillmentOrders',
      endpoint: 'fulfillmentOutbound',
    })

    // Extract fulfillment orders
    return response || []
  } catch (error) {
    console.error('Error fetching fulfillment orders:', error)
    throw error
  }
}

async function cancelFulfillmentOrder(orderId) {
  const client = await initSPClient()
  try {
    const response = await client.callAPI({
      operation: 'cancelFulfillmentOrder',
      endpoint: 'fulfillmentOutbound',
      path: {
        sellerFulfillmentOrderId: orderId,
      },
    })
    return response
  } catch (error) {
    console.error('Error cancelling fulfillment order:', error)
    throw error
  }
}

async function createFulfillmentOrder(orderDetails) {
  const client = await initSPClient()
  try {
    const response = await client.callAPI({
      operation: 'createFulfillmentOrder',
      endpoint: 'fulfillmentOutbound',
      body: {
        sellerFulfillmentOrderId: orderDetails.sellerFulfillmentOrderId,
        displayableOrderId: orderDetails.displayableOrderId,
        displayableOrderDate: orderDetails.displayableOrderDate,
        displayableOrderComment: 'Thank you for your purchase!',
        // displayableOrderComment: orderDetails.displayableOrderComment,
        shippingSpeedCategory: 'Standard',
        destinationAddress: {
          name: orderDetails.destinationAddress.name,
          addressLine1: orderDetails.destinationAddress.addressLine1,
          addressLine2: orderDetails.destinationAddress.addressLine2,
          city: orderDetails.destinationAddress.city,
          districtOrCounty: orderDetails.destinationAddress.districtOrCounty,
          stateOrRegion: orderDetails.destinationAddress.stateOrRegion,
          postalCode: orderDetails.destinationAddress.postalCode,
          countryCode: orderDetails.destinationAddress.countryCode,
          phoneNumber: orderDetails.destinationAddress.phoneNumber,
        },
        fulfillmentAction: 'Hold',
        fulfillmentPolicy: 'FillAll',
        notificationEmails: orderDetails.notificationEmails || [],
        marketplaceId: config.MARKET_PLACE_ID,
        items: orderDetails.items.map((item) => ({
          sellerSku: item.sellerSku,
          sellerFulfillmentOrderItemId: item.productId,
          quantity: item.quantity,
          giftMessage: 'Wishing you joy and happiness with your new purchase!',
          // displayableComment: item.displayableComment,
        })),
      },
    })

    //console.log('Fulfillment order created successfully:', response);
    return response
  } catch (error) {
    console.error('Error creating fulfillment order:', error)
    throw error
  }
}
async function getFulfillmentOrder(orderId) {
  const client = await initSPClient()
  return client.callAPI({
    operation: 'getFulfillmentOrder',
    endpoint: 'fulfillmentOutbound',
    path: { sellerFulfillmentOrderId: orderId },
  })
}

async function fetchTrackingDetails(packageNumber) {
  const client = await initSPClient()
  try {
    return await client.callAPI({
      operation: 'getPackageTrackingDetails',
      endpoint: 'fulfillmentOutbound',
      query: { packageNumber },
    })
  } catch (error) {
    console.error(
      `Error fetching tracking details for package: ${packageNumber}`,
      error
    )
    throw error
  }
}

module.exports = {
  listAllFulfillmentOrders,
  createFulfillmentOrder,
  getFulfillmentOrder,
  fetchTrackingDetails,
  cancelFulfillmentOrder,
}
