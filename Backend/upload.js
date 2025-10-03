const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { UPLOAD_DIR } = require('./config')

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${uuidv4()}${ext}`)
    }
})

module.exports = multer({ storage })