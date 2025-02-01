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

// const generateSKU = async () => {
//   const lastProduct = await Product.findOne({
//     order: [['createdAt', 'DESC']],  // Get latest product
//   });

//   if (lastProduct) {
//     const lastSku = lastProduct.id.replace('SKU', '');  // Remove "SKU" prefix
//     const nextSku = parseInt(lastSku) + 1;  // Increment numeric part
//     return `SKU${String(nextSku).padStart(4, '0')}`;  // Format to SKU0001, SKU0002
//   } else {
//     return 'SKU0001';  // Default for first product
//   }
// };

// // Create a New Product with SKU
// const createProduct = async (productData) => {
//   const sku = await generateSKU();

//   const newProduct = await Product.create({
//     id: sku,
//     name: productData.name,
//     desc: productData.desc,
//     price: productData.price,
//     imageUrls: productData.imageUrls,
//   });

//   return newProduct;
// };
//UUID
