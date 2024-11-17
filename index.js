const logger = require('./src/app/logger/logger')
const server = require('./src/http/server')

async function startApplication() {
  const app = server('app')

  function handleShutdown(signal) {
    console.log(`Recieved ${signal} from application`)
    app.stopServer().then((res) => {
      console.log('Server stooped !!!')
    })
  }

  process.on('SIGINT', handleShutdown)
  process.on('SIGTERM', handleShutdown)
  process.on('uncaughtException', logUnexpectedError)
  process.on('unhandledRejection', logUnexpectedError)

  function logUnexpectedError(error, origin) {
    logger.error(`Uncaught Exception: ${error} at ${origin}`)
  }

  try {
    await app.startServer()

    console.log('Server started successfully')
  } catch (error) {
    console.log(`Error occurred while starting server: ${error}`)
  }
}

startApplication()
