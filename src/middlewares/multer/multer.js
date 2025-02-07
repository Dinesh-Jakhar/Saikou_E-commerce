const multer = require('multer')
const fs = require('fs/promises')
const path = require('path')
// const CustomError = require('../error_handler/CustomError')
const projectRootPath = path.join(__dirname, '../../')
const productPATH = path.join(projectRootPath, 'uploads/products')

const createUploadsPath = async () => {
  try {
    await fs.mkdir(productPATH, { recursive: true })
  } catch (err) {
    console.error(err)
  }
}

createUploadsPath()

const productUpload = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productPATH)
  },
  filename: (req, file, cb) => {
    const key = file.fieldname
    const timestamp = Date.now()
    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9.\-_]/g,
      '_'
    )
    const uniqueFilename = `${key}-${timestamp}-${sanitizedOriginalName}`
    if (!req.body.files) {
      req.body.files = {}
    }
    if (!req.body.files[key]) {
      req.body.files[key] = []
    }
    req.body.files[key].push(uniqueFilename)
    cb(null, uniqueFilename)
  },
})

// Multer instance for multiple file uploads
const uploadMultipleImages = multer({
  storage: productUpload,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 7,
  }, // 1MB limit per file
}).fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'descImages', maxCount: 6 },
])

module.exports = {
  uploadMultipleImages,
}
