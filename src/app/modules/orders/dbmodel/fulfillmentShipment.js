module.exports = (sequelize, DataTypes) => {
  const FulfillmentShipment = sequelize.define(
    'FulfillmentShipment',
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
      amazonShipmentId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      fulfillmentCenterId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fulfillmentShipmentStatus: {
        type: DataTypes.ENUM(
          'PENDING',
          'SHIPPED',
          'CANCELLED_BY_SELLER',
          'CANCELLED_BY_FULFILLER'
        ),
        allowNull: true,
      },
      packageNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      carrierCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      trackingNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      orderCurrentStatus: {
        type: DataTypes.ENUM(
          'IN_TRANSIT',
          'DELIVERED',
          'RETURNING',
          'RETURNED',
          'RETURN_REJECTED',
          'UNDELIVERABLE',
          'DELAYED',
          'OUT_FOR_DELIVERY',
          'DELIVERY_ATTEMPTED',
          'OTHER'
        ),
        allowNull: true,
      },
      return_reason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      estimatedArrivalDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'FulfillmentShipment',
      timestamps: true,
      paranoid: true,
    }
  )

  FulfillmentShipment.associate = (models) => {
    FulfillmentShipment.belongsTo(models.OrderDetail, {
      foreignKey: 'orderId',
      as: 'fulfillmentShipments',
    })
  }

  return FulfillmentShipment
}
