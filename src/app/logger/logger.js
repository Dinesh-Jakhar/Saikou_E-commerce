var winston = require('winston')

var logger = winston.createLogger({
  levels: winston.config.npm.levels,
  // format: winston.format.json(),
  format: winston.format.combine(
    winston.format.colorize({ all: true }), // Adds color to the output based on the log level
    winston.format.simple() // Uses a simple format for log messages
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
})

module.exports = logger
