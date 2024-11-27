const productRepository = ({ writerDatabase, readerDatabase }) => ({
  allProducts: async () => {
    try {
      const productModel = await readerDatabase('Product')
      const inventoryModel = await readerDatabase('Inventory')
      const discountModel = await readerDatabase('Discount')

      const allProds = await productModel.findAll({
        include: [
          {
            model: discountModel,
            attributes: ['id', 'name', 'discount_percent', 'deleted_at'],
            as: 'discounts',
          },
          {
            model: inventoryModel,
            attributes: ['quantity'],
            as: 'inventory',
          },
        ],
        attributes: [
          'name',
          'desc',
          'price',
          'deleted_at',
          'imageUrls',
          'created_at',
        ],
        paranoid: true,
      })
      return allProds
    } catch (error) {
      throw error
    }
  },
  updateProduct: async (id, name, desc, price, discountId, quantity) => {
    try {
      const productModel = await readerDatabase('Product')
      const inventoryModel = await readerDatabase('Inventory')
      const discountModel = await readerDatabase('Discount')

      const product = await productModel.findByPk(id)
      if (!product) {
        throw new CustomError({
          ...HTTP_ERRORS.BAD_REQUEST,
          errors: 'Product not found',
        })
      }

      if (discountId) {
        const discount = await discountModel.findByPk(discountId)
        if (!discount) {
          throw new CustomError({
            ...HTTP_ERRORS.BAD_REQUEST,
            errors: 'Invalid discount ID',
          })
        }
      }

      product.name = name || product.name
      product.desc = desc || product.desc
      product.price = price || product.price
      product.discountId = discountId || product.discountId
      await product.save()

      if (quantity !== undefined) {
        let inventory = await inventoryModel.findOne({
          where: { productId: id },
        })
        if (!inventory) {
          // Create an inventory record if it does not exist
          inventory = await inventoryModel.create({
            productId: id,
            quantity,
          })
        } else {
          inventory.quantity = quantity
          await inventory.save()
        }
      }

      const updatedProduct = await productModel.findByPk(id, {
        include: [
          {
            model: discountModel,
            attributes: ['id', 'name', 'discountPercent'],
            as: 'discounts',
          },
          {
            model: inventoryModel,
            attributes: ['quantity'],
            as: 'inventory',
          },
        ],
      })

      return updatedProduct
    } catch (error) {
      throw error
    }
  },
  createDiscount: async (name, desc, discountPercent) => {
    try {
      const discountModel = await readerDatabase('Discount')
      const discount = await discountModel.create({
        name,
        desc,
        discountPercent,
      })
      return discount
    } catch (error) {
      throw error
    }
  },
  discountExists: async (discountId) => {
    try {
      const discountModel = await readerDatabase('Discount')
      const discount = await discountModel.findOne({
        where: { id: discountId },
        paranoid: true,
      })
      return discount
    } catch (error) {
      throw error
    }
  },
  addNewProduct: async (
    name,
    desc,
    price,
    discountId,
    unitsInStock,
    imageUrls
  ) => {
    try {
      const productModel = await writerDatabase('Product')
      const inventoryModel = await writerDatabase('Inventory')
      const product = await productModel.create({
        name,
        desc,
        price,
        discountId,
        unitsInStock,
        imageUrls,
      })
      await inventoryModel.create({
        productId: product.id,
        quantity: unitsInStock,
      })
      return product
    } catch (error) {
      throw error
    }
  },
})

module.exports = productRepository

// updateProduct: async (id, name, desc, price, discountId, quantity) => {
//   try {
//     // Fetch the models
//     const productModel = await readerDatabase('Product');
//     const inventoryModel = await readerDatabase('Inventory');
//     const discountModel = await readerDatabase('Discount');

//     // Fetch the existing product and inventory
//     const product = await productModel.findByPk(id);
//     if (!product) {
//       throw new Error(`Product with ID ${id} not found`);
//     }

//     const inventory = await inventoryModel.findOne({
//       where: { productId: id },
//     });

//     // Check if discountId is provided, otherwise keep the existing discountId
//     let finalDiscountId = discountId;
//     if (!discountId) {
//       finalDiscountId = product.discountId; // Use the existing discountId
//     } else {
//       // Validate the discountId if provided
//       const discount = await discountModel.findByPk(discountId);
//       if (!discount) {
//         throw new Error(`Discount with ID ${discountId} not found`);
//       }
//     }

//     // Update the product
//     await product.update({
//       name: name || product.name,
//       desc: desc || product.desc,
//       price: price || product.price,
//       discountId: finalDiscountId,
//     });

//     // Update the inventory if quantity is provided
//     if (quantity !== undefined) {
//       if (!inventory) {
//         // If inventory does not exist, create it
//         await inventoryModel.create({
//           productId: id,
//           quantity,
//         });
//       } else {
//         // Update existing inventory
//         await inventory.update({ quantity });
//       }
//     }

//     // Return updated product with associated inventory and discount
//     const updatedProduct = await productModel.findByPk(id, {
//       include: [
//         {
//           model: inventoryModel,
//           as: 'inventory',
//         },
//         {
//           model: discountModel,
//           as: 'discounts',
//         },
//       ],
//     });

//     return updatedProduct;
//   } catch (error) {
//     console.error('Error updating product:', error.message);
//     throw error;
//   }
// };
