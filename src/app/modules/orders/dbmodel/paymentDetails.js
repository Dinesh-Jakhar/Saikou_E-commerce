module.exports = (sequelize, DataTypes) => {
  const PaymentDetails = sequelize.define(
    'PaymentDetails',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      paymentId: {
        type: DataTypes.STRING,
        allowNull: false, // Stripe Payment Intent ID
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'OrderDetail',
          key: 'id',
        },
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // provider: {
      //   type: DataTypes.STRING,
      //   allowNull: true,  // Payment provider (e.g., 'stripe')
      // },
      status: {
        type: DataTypes.ENUM(
          'succeeded',
          'failed',
          'pending',
          'partially_received',
          'canceled'
        ),
        allowNull: false,
      },
      payment_method_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      failureReason: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // paymentAttempts: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true,  // Number of attempts made to process the payment
      //   defaultValue: 0,  // Default to 0 attempts
      // },
      paymentConfirmationTimestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      // paymentReceiptEmail: {
      //   type: DataTypes.STRING,
      //   allowNull: true,  // Receipt email, if provided by the user
      // },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'PaymentDetails',
      timestamps: true,
    }
  )

  PaymentDetails.associate = (models) => {
    PaymentDetails.belongsTo(models.OrderDetail, {
      foreignKey: 'orderId',
      as: 'order',
    })
  }

  return PaymentDetails
}
