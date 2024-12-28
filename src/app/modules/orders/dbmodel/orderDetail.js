module.exports = (sequelize, DataTypes) => {
  const OrderDetail = sequelize.define(
    'OrderDetail',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      order_status: {
        type: DataTypes.ENUM,
        values: [
          'pending',
          // 'failed',
          'accepted',
          'shipped',
          'delivered',
          'canceled',
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
    OrderDetail.hasOne(models.PaymentDetails, {
      foreignKey: 'orderId',
      as: 'paymentDetails',
    })
  }

  return OrderDetail
}
