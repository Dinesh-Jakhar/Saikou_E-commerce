const multer = require('multer')
const fs = require('fs')
const path = require('path')
const CustomError = require('../error_handler/CustomError')

// Define the upload folder
const UPLOADS_DIR = path.join(__dirname, '../../../uploads/products')

// const ensureUploadFolder = () => {
//   if (!fs.existsSync(UPLOADS_DIR)) {
//     fs.mkdirSync(UPLOADS_DIR, { recursive: true });
//     console.log(`Created upload folder: ${UPLOADS_DIR}`);
//   }
// };

// Configure multer storage
const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    const name = req.body.name
    if (!name) {
      return cb(
        new CustomError({
          statusCode: 400,
          message: "Product 'name' is required to create a folder.",
        })
      )
    }
    const productFolder = path.join(UPLOADS_DIR, name)
    if (!fs.existsSync(productFolder)) {
      fs.mkdirSync(productFolder, { recursive: true })
      console.log(`Created folder for product: ${productFolder}`)
    }

    cb(null, productFolder)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${file.fieldname}_${Date.now()}_${file.originalname}`
    cb(null, uniqueName)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif,image/jpg']
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, gif, jpg)'), false)
  }
}

// Multer instance for multiple file uploads
const uploadMultipleImages = multer({
  storage: storageProduct,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'descImages', maxCount: 10 },
])

module.exports = {
  uploadMultipleImages,
  //   ensureUploadFolder
}
