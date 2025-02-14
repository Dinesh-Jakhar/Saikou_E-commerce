const configs = require('../../../config/config')
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      desc: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      imageUrls: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      fullImageUrls: {
        type: DataTypes.VIRTUAL,
        get() {
          const baseUrl = configs.SERVER_IMAGE_URL
          const rawImages = this.getDataValue('imageUrls') || []
          return rawImages.map((image) => `${baseUrl}${image}`)
        },
      },
      discountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Discount',
          key: 'id',
        },
      },
      sellerSku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      fnSku: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      asin: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
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
      tableName: 'Product',
      paranoid: true,
    }
  )

  Product.associate = (models) => {
    Product.belongsTo(models.Discount, {
      foreignKey: 'discountId',
      as: 'discounts',
    })
    Product.hasOne(models.Inventory, {
      foreignKey: 'productId',
      as: 'inventory',
    })
    Product.hasMany(models.CartItem, {
      foreignKey: 'productId',
      as: 'cartItems',
    })
  }

  return Product
}
