const config = {}
console.log('Loading env variables from env file')
require('dotenv').config({ processEnv: config })
config.ENV = config.ENV ? config.ENV : 'development'
config.ALLOWED_ORIGINS = config.ALLOWED_ORIGINS.split(',')
console.log(`Environment : ${config.ENV}`)
module.exports = config
