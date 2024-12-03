module.exports = (sequelize, DataTypes) => {
  const ShoppingSession = sequelize.define(
    'ShoppingSession',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true, // Nullable for guest sessions
        references: {
          model: 'User',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      // total: {
      //   type: DataTypes.DECIMAL(10, 2),
      //   allowNull: false,
      //   defaultValue: 0.0,
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
      tableName: 'ShoppingSession',
      timestamps: true,
    }
  )

  ShoppingSession.associate = (models) => {
    ShoppingSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    })
    ShoppingSession.hasMany(models.CartItem, {
      foreignKey: 'sessionId',
      as: 'cartItems',
    })
  }

  return ShoppingSession
}
