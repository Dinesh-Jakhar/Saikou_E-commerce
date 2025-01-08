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
      addressId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Address',
          key: 'id',
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      shippingSpeedCategory: {
        type: DataTypes.ENUM('Standard', 'Expedited', 'Priority'),
        allowNull: true,
        defaultValue: 'Standard',
      },
      fulfillmentAction: {
        type: DataTypes.ENUM('Ship', 'Hold'),
        allowNull: true,
        defaultValue: 'Hold', //change this to ship
      },
      fulfillmentPolicy: {
        type: DataTypes.ENUM('FillOrKill', 'FillAllAvailable'),
        allowNull: true,
        defaultValue: 'FillOrKill',
      },
      order_status: {
        type: DataTypes.ENUM,
        values: [
          'pending',
          'pendingAmazon',
          'onAmazon',
          'return_requested',
          'returned',
          'return_failed',
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
    OrderDetail.belongsTo(models.Address, {
      foreignKey: 'addressId',
      as: 'address',
    })
    OrderDetail.hasOne(models.PaymentDetails, {
      foreignKey: 'orderId',
      as: 'paymentDetails',
    })
  }

  return OrderDetail
}
