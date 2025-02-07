module.exports = (sequelize, DataTypes) => {
  const OrderDetail = sequelize.define(
    'OrderDetail',
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      // addressId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: 'Address',
      //     key: 'id',
      //   },
      // },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      fulfillmentOrderStatus: {
        type: DataTypes.ENUM(
          'New',
          'Received',
          'Planning',
          'Processing',
          'Cancelled',
          'Complete',
          'CompletePartialled',
          'Unfulfillable',
          'Invalid'
        ), //Pending is any other status
        allowNull: true,
        // defaultValue: 'Received',
      },
      order_status: {
        type: DataTypes.ENUM,
        values: [
          'pending',
          'pendingAmazon',
          'onAmazon',
          // 'return_requested',
          // 'returned',
          // 'return_failed',
        ],
        defaultValue: 'pending',
        allowNull: false,
      },
      // paymentId: {
      //   type: DataTypes.UUID,
      //   allowNull: true,
      //   references: {
      //     model: 'Payment',
      //     key: 'id',
      //   },
      // },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'OrderDetail',
      timestamps: true,
      paranoid: true,
    }
  )

  OrderDetail.associate = (models) => {
    OrderDetail.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
    // OrderDetail.belongsTo(models.Payment, {
    //   foreignKey: 'paymentId',
    //   as: 'payment',
    // });
    OrderDetail.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'orderItems',
    })
    // OrderDetail.belongsTo(models.Address, {
    //   foreignKey: 'addressId',
    //   as: 'address',
    // })
    OrderDetail.hasOne(models.PaymentDetails, {
      foreignKey: 'orderId',
      as: 'paymentDetails',
    })
    OrderDetail.hasOne(models.OrderAddress, {
      foreignKey: 'orderId',
      as: 'orderAddress',
    })
    OrderDetail.hasOne(models.FulfillmentShipment, {
      foreignKey: 'orderId',
      as: 'fulfillmentShipments',
    })
  }

  return OrderDetail
}
