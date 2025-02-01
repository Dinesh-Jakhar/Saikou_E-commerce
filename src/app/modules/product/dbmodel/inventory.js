module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    'Inventory',
    {
      productId: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
          model: 'Product',
          key: 'id',
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0, // Prevents negative values
        },
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
      tableName: 'Inventory',
      paranoid: true,
    }
  )

  Inventory.associate = (models) => {
    Inventory.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product',
    })
  }

  return Inventory
}
