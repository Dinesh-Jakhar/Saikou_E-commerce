module.exports = (sequelize, DataTypes) => {
  const OrderAddress = sequelize.define(
    'OrderAddress',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'OrderDetail',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      addressLine1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      addressLine2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      districtOrCounty: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stateOrRegion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postalCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING(2), // ISO 3166-1 alpha-2 format
        allowNull: false,
        defaultValue: 'US',
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'OrderAddress',
    }
  )

  OrderAddress.associate = (models) => {
    OrderAddress.belongsTo(models.OrderDetail, {
      foreignKey: 'orderId',
      as: 'order',
    })
  }

  return OrderAddress
}
