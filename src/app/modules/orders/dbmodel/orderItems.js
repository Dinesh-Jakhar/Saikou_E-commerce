module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    'OrderItem',
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
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Product',
          key: 'id',
        },
      },
      sellerSku: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      orderItemAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
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
      tableName: 'OrderItem',
      timestamps: true,
      paranoid: true,
    }
  )

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.OrderDetail, {
      foreignKey: 'orderId',
      as: 'orderDetail',
    })
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    })
  }

  return OrderItem
}
