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

module.exports = {
  listAllFulfillmentOrders,
}
