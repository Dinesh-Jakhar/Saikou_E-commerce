module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      desc: {
        type: DataTypes.STRING,
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
  }

  return Product
}

//    // Transform the data for better response formatting
//    const formattedProducts = products.map((product) => {
//     const discount = product.Discount
//       ? product.Discount.discount_percent
//       : 0;
//     const discountedPrice =
//       product.price - (product.price * discount) / 100;

//     return {
//       id: product.id,
//       name: product.name,
//       description: product.desc,
//       original_price: product.price,
//       final_price: discountedPrice.toFixed(2), // Round to 2 decimal places
//       discount: product.Discount
//         ? {
//             id: product.Discount.id,
//             name: product.Discount.name,
//             discount_percent: discount,
//             active: product.Discount.active,
//           }
//         : null,
//       inventory: product.ProductInventory
//         ? {
//             quantity: product.ProductInventory.quantity,
//             status:
//               product.ProductInventory.quantity > 0
//                 ? "In Stock"
//                 : "Out of Stock",
//           }
//         : null,
//       created_at: product.created_at,
//       updated_at: product.updated_at,
//     };
//   });

//   // Example pagination (mocked for now)
//   const pagination = {
//     total: formattedProducts.length,
//     limit: 10,
//     page: 1,
//   };

//   res.json({
//     status: "success",
//     data: {
//       products: formattedProducts,
//     },
//     pagination,
//   });
// } catch (err) {
//   console.error(err);
//   res.status(500).json({ status: "error", message: "Internal server error" });
// }
// });
