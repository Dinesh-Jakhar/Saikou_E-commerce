module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define(
    'CartItem',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ShoppingSession',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false, //Do Nullable for guest items
        references: {
          model: 'User',
          key: 'id',
        },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Product',
          key: 'id',
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
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
      tableName: 'CartItem',
      timestamps: true,
    }
  )

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.ShoppingSession, {
      foreignKey: 'sessionId',
      as: 'session',
    })
    CartItem.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    })
    CartItem.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
  }

  return CartItem
}
