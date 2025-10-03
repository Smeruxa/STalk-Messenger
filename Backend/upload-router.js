const express = require("express")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")
const sharp = require("sharp")
const { v4: uuidv4 } = require("uuid")
const upload = require("./upload")
const { pool, SECRET, UPLOAD_DIR, UPLOAD_URL_PATH } = require("./config")

const router = express.Router()

router.post("/stalk/upload-avatar", upload.single("avatar"), async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]
        if (!token) return res.status(401).json({ error: "No token" })
        const user = jwt.verify(token, SECRET)
        if (!req.file) return res.status(400).json({ error: "No file uploaded" })

        let filePath = path.join(UPLOAD_DIR, req.file.filename)
        let stats = fs.statSync(filePath)
        if (stats.size > 150 * 1024) {
            let quality = 80
            let compressedName, compressedPath, buffer
            do {
                compressedName = `${uuidv4()}${path.extname(req.file.filename)}`
                compressedPath = path.join(UPLOAD_DIR, compressedName)
                buffer = await sharp(filePath)
                    .resize({ width: 600 })
                    .jpeg({ quality })
                    .toBuffer()
                await fs.promises.writeFile(compressedPath, buffer)
                quality -= 10
            } while (buffer.length > 150 * 1024 && quality > 10)
            fs.unlinkSync(filePath)
            filePath = compressedPath
            req.file.filename = compressedName
        }

        const result = await pool.query("SELECT avatar FROM users WHERE id = $1", [user.id])
        const oldAvatar = result.rows[0]?.avatar

        if (oldAvatar && !oldAvatar.includes("stalk_default")) {
            const oldPath = path.join(UPLOAD_DIR, path.basename(oldAvatar))
            fs.unlink(oldPath, err => { if (err && err.code !== "ENOENT") console.error(err) })
        }

        const avatarPath = `${UPLOAD_URL_PATH}/${req.file.filename}`
        await pool.query("UPDATE users SET avatar = $1 WHERE id = $2", [avatarPath, user.id])
        res.json({ avatar: avatarPath })
    } catch (e) {
        console.error("Upload avatar error:", e)
        res.status(403).json({ error: "Ошибка загрузки аватара" })
    }
})

module.exports = router