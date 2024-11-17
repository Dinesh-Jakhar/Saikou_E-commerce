const { Sequelize } = require('sequelize')
const fs = require('fs')
const path = require('path')

const basename = path.basename(__filename)
const config = require('../../app/config/config')
const logger = require('../../app/logger/logger')
const moduleNames = require('./db_exposed_models')
const {
  DB_MODULES_PATH,
  DB_MODEL_PATH,
} = require('../../app/constants/constants')

//TODO: move conoomn config above - clean up
const writerSequelize = new Sequelize(
  config.WRITER_DB_SCHEMA,
  config.WRITER_DB_USERNAME,
  config.WRITER_DB_PASSWORD,
  {
    host: config.WRITER_DB_HOSTNAME,
    dialect: 'mysql',
    pool: {
      max: Number(config.WRITER_DB_POOL_MAX),
      min: Number(config.WRITER_DB_POOL_MIN),
      acquire: config.WRITER_DB_POOL_ACQUIRE,
      idle: config.WRITER_DB_POOL_IDLE,
      handleDisconnects: true,
    },
    dialectOptions: {
      debug: false,
    },
    define: {
      freezeTableName: true,
      underscored: true,
    },
    logging: false,
    sync: true,
  }
)

const readerSequelize = new Sequelize(
  config.READER_DB_SCHEMA,
  config.READER_DB_USERNAME,
  config.READER_DB_PASSWORD,
  {
    host: config.READER_DB_HOSTNAME,
    dialect: 'mysql',
    pool: {
      max: Number(config.READER_DB_POOL_MAX),
      min: Number(config.READER_DB_POOL_MIN),
      acquire: config.READER_DB_POOL_ACQUIRE,
      idle: config.READER_DB_POOL_IDLE,
      handleDisconnects: true,
    },
    dialectOptions: {
      debug: false,
    },
    define: {
      freezeTableName: true,
      underscored: true,
    },
    logging: false,
    sync: true,
  }
)

const db = {
  writer: {
    database: writerSequelize,
    Sequelize: Sequelize,
  },
  reader: {
    database: readerSequelize,
    Sequelize: Sequelize,
  },
}

const loadModules = async () => {
  const dirs = []
  const modluesPath = path.join(__dirname, DB_MODULES_PATH)
  //TODO: load db modules dynamically
  const dbModelPath = moduleNames

  dbModelPath.forEach((module) => {
    dirs.push(path.join(modluesPath, module, DB_MODEL_PATH))
  })

  for (const i in dirs) {
    const dir = dirs[i]
    fs.readdirSync(dir)
      .filter((file) => {
        return (
          file.indexOf('.') !== 0 &&
          file !== basename &&
          file.slice(-3) === '.js'
        )
      })
      .forEach((file) => {
        const model = require(path.join(dir, file))(
          writerSequelize,
          Sequelize.DataTypes
        )
        db.writer[model.name] = model

        const model1 = require(path.join(dir, file))(
          readerSequelize,
          Sequelize.DataTypes
        )
        db.reader[model.name] = model1
      })
  }

  // Object.keys(db).forEach(modelName => {
  //     if (db[modelName].associate) {
  //         db.reader[modelName].associate(db);
  //         db.writer[modelName].associate(db);
  //     }
  // });
  Object.keys(db.writer).forEach((modelName) => {
    if (db.writer[modelName].associate) {
      db.writer[modelName].associate(db.writer)
    }
  })

  Object.keys(db.reader).forEach((modelName) => {
    if (db.reader[modelName].associate) {
      db.reader[modelName].associate(db.reader)
    }
  })
  return db
}

const initializeDatabase = async () => {
  await loadModels()
  await initializeReaderDatabase()
  await initializeWriterDatabase()
}

const loadModels = async () => {
  try {
    await loadModules()
  } catch (error) {
    logger.error('Error synchronizing models:', error)
  }
}

const initializeWriterDatabase = async () => {
  try {
    await db.writer.database.authenticate()
    if (config.ENV === 'development') {
      await db.writer.database.sync({ alter: true })
    }
    logger.info('Writer database connection has been established successfully.')
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
  }
}

const initializeReaderDatabase = async () => {
  try {
    await db.reader.database.authenticate()
    if (config.ENV === 'development') {
      await db.reader.database.sync({ alter: true })
    }
    logger.info('Reader database connection has been established successfully.')
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
  }
}

const closeDbConnections = async () => {
  try {
    await db.writer.database.close()
    await db.reader.database.close()
    logger.info('Database connections closed successfully.')
  } catch (error) {
    logger.error('Error closing the database connections:', error)
  }
}

// TODO: re-check this implementation
const readerDatabase = async (name) => {
  return db.reader[name]
}

const writerDatabase = async (name) => {
  return db.writer[name]
}

module.exports = {
  db,
  initializeDatabase,
  closeDbConnections,
  readerDatabase,
  writerDatabase,
  writerSequelize,
  readerSequelize,
}
