const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { pool, SECRET } = require("./config")
const { createClient } = require("redis")
const userSockets = new Map()

module.exports = async (io) => {
    const redis = createClient()
    redis.on("error", err => console.error("Redis error:", err))
    await redis.connect()

    io.use((socket, next) => {
        const { token } = socket.handshake.auth || {}
        if (!token) return next()
        jwt.verify(token, SECRET, (err, user) => {
            if (err) return next()
            socket.user = user
            next()
        })
    })

    io.on("connection", (socket) => {
        if (socket.user?.id) userSockets.set(socket.user.id, socket.id)
        socket.on("disconnect", () => {
            if (socket.user?.id) userSockets.delete(socket.user.id)
        })

        socket.on("register", async ({ username, password }) => {
            if (!username || !password) {
                socket.emit("register_error", "Введите никнейм и пароль")
                return
            }
            try {
                const exists = await pool.query("SELECT 1 FROM users WHERE username = $1", [username])
                if (exists.rowCount) {
                    socket.emit("register_error", "Такой ник уже занят")
                    return
                }
                const hashed = await bcrypt.hash(password, 10)
                await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashed])
                socket.emit("register_success")
            } catch {
                socket.emit("register_error", "Ошибка в БД")
            }
        })

        socket.on("login", async ({ username, password }) => {
            const ip = socket.handshake.headers["x-forwarded-for"]?.split(",")[0]?.trim() || socket.handshake.address
            const subnet = ip.split(".").slice(0, 3).join(".") + ".*"
            const banKey = `ban:${subnet}`
            const triesKey = `tries:${subnet}`

            if (await redis.exists(banKey)) {
                socket.emit("login_error", "Слишком много попыток, попробуйте через час")
                return
            }

            if (!username || !password) {
                socket.emit("login_error", "Введите никнейм и пароль")
                return
            }

            try {
                const res = await pool.query("SELECT id, password FROM users WHERE username = $1", [username])
                if (!res.rowCount || !(await bcrypt.compare(password, res.rows[0].password))) {
                    const count = await redis.incr(triesKey)
                    if (count === 1) await redis.expire(triesKey, 3600)
                    if (count >= 3) await redis.setEx(banKey, 3600, "1")
                    socket.emit("login_error", "Неверные учетные данные")
                    return
                }

                await redis.del(triesKey)
                const token = jwt.sign({ id: res.rows[0].id, username }, SECRET, { expiresIn: "24h" })
                socket.emit("login_success", { token, userId: res.rows[0].id })
            } catch {
                socket.emit("login_error", "Ошибка в БД")
            }
        })

        if (!socket.user) return

        socket.on("send_message", async ({ to, content, reply_to }) => {
            if (!to || !content) return
            const senderId = socket.user.id
            const createdAt = new Date()
            
            const replyToId = typeof reply_to === "string" && reply_to.trim() !== "" ? Number(reply_to) : null;
            const res = await pool.query(
                "INSERT INTO messages (sender_id, receiver_id, content, created_at, reply_to) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [senderId, to, content, createdAt, replyToId]
            )

            const messageId = res.rows[0].id

            const fullMessageRes = await pool.query(
                `SELECT m.*, 
                    r.content AS reply_text, 
                    u.username AS reply_user_name
                FROM messages m
                LEFT JOIN messages r ON m.reply_to = r.id::bigint
                LEFT JOIN users u ON r.sender_id = u.id
                WHERE m.id = $1`,
                [messageId]
            )

            const message = {
                ...fullMessageRes.rows[0],
                id: fullMessageRes.rows[0].id.toString(),
                created_at: fullMessageRes.rows[0].created_at.toISOString(),
                reply_text: fullMessageRes.rows[0].reply_text || null,
                reply_user_name: fullMessageRes.rows[0].reply_user_name || null,
            }

            socket.emit("new_message_channel", message)
            const receiverSocketId = userSockets.get(to)
            if (receiverSocketId) io.to(receiverSocketId).emit("new_message_channel", message)
        })  

        socket.on("get_dialogs", async () => {
            const userId = socket.user.id
            try {
                const res = await pool.query(`
                    SELECT u.id, u.username, u.avatar, u.agree_screen, m.content, m.created_at, m.sender_id
                    FROM users u
                    JOIN LATERAL (
                        SELECT content, created_at, sender_id
                        FROM messages
                        WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) m ON true
                    WHERE u.id != $1
                    ORDER BY m.created_at DESC
                `, [userId])
                socket.emit("dialogs", res.rows)
            } catch {}
        })

        socket.on("get_messages", async ({ withUserId, offset = 0, limit = 20 }) => {
            const userId = socket.user.id
            try {
                const res = await pool.query(
                    `SELECT m.*, r.content AS reply_text, u.username AS reply_user_name
                    FROM messages m
                    LEFT JOIN messages r ON m.reply_to = r.id
                    LEFT JOIN users u ON r.sender_id = u.id
                    WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
                    ORDER BY m.created_at DESC
                    OFFSET $3 LIMIT $4`,
                    [userId, withUserId, offset, limit]
                )
                socket.emit("messages", res.rows.reverse())
            } catch {}
        })

        socket.on("search_users", async ({ query }) => {
            if (!query) return
            try {
                const userId = socket.user.id
                const res = await pool.query(
                    `SELECT id, username FROM users WHERE can_show = true AND username ILIKE $1 AND id != $2 LIMIT 20`,
                    [`%${query}%`, userId]
                )
                socket.emit("search_results", res.rows)
            } catch {}
        })

        socket.on("set_can_show", async (value) => {
            const userId = socket.user?.id
            if (!userId) return
            try {
                await pool.query("UPDATE users SET can_show = $1 WHERE id = $2", [value, userId])
            } catch {}
        })

        socket.on("get_can_show", async () => {
            const userId = socket.user?.id
            if (!userId) return
            try {
                const res = await pool.query("SELECT can_show FROM users WHERE id = $1", [userId])
                socket.emit("can_show", res.rows[0]?.can_show || false)
            } catch {
                socket.emit("can_show", false)
            }
        })

        socket.on("get_last_status", async ({ withUserId }) => {
            try {
                const res = await pool.query(
                    "SELECT last_online, last_typing FROM users WHERE id = $1",
                    [withUserId]
                )
                const { last_online, last_typing } = res.rows[0] || {}
                socket.emit("last_status", { fromUserId: withUserId, last_online, last_typing })
            } catch {}
        })

        socket.on("update_typing", async ({ to }) => {
            try {
                await pool.query(
                    "UPDATE users SET last_typing = NOW(), last_online = NOW() WHERE id = $1",
                    [socket.user.id]
                )
                socket.emit("typing", { fromUserId: socket.user.id })
                const receiverSocketId = userSockets.get(to)
                if (receiverSocketId) io.to(receiverSocketId).emit("typing", { fromUserId: socket.user.id })
            } catch {}
        })

        socket.on("update_online", async () => {
            try {
                await pool.query(
                    "UPDATE users SET last_online = NOW() WHERE id = $1",
                    [socket.user.id]
                )
            } catch {}
        })

        socket.on("change_password", async ({ oldPassword, newPassword }) => {
            if (!oldPassword || !newPassword) {
                socket.emit("change_password_error", "Введите оба пароля")
                return
            }
            try {
                const res = await pool.query("SELECT password FROM users WHERE id = $1", [socket.user.id])
                if (!res.rowCount) {
                    socket.emit("change_password_error", "Пользователь не найден")
                    return
                }
                const match = await bcrypt.compare(oldPassword, res.rows[0].password)
                if (!match) {
                    socket.emit("change_password_error", "Старый пароль неверный")
                    return
                }
                const hashed = await bcrypt.hash(newPassword, 10)
                await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, socket.user.id])
                socket.emit("change_password_success")
            } catch {
                socket.emit("change_password_error", "Ошибка сервера")
            }
        })

        socket.on("upload_avatar", async ({ avatarPath }) => {
            try {
                await pool.query("UPDATE users SET avatar = $1 WHERE id = $2", [avatarPath, socket.user.id])
                socket.emit("avatar_update_success")
            } catch {
                socket.emit("avatar_update_error", "Ошибка загрузки аватара")
            }
        })
        
        socket.on("get_avatar", async () => {
            try {
                const result = await pool.query("SELECT avatar FROM users WHERE id = $1", [socket.user.id])
                const avatar = result.rows[0]?.avatar
                socket.emit("avatar_url", avatar || "")
            } catch {
                socket.emit("avatar_url", "")
            }
        })

        socket.on("get_username", async () => {
            try {
                const res = await pool.query("SELECT username FROM users WHERE id = $1", [socket.user.id])
                socket.emit("username", res.rows[0]?.username || "")
            } catch {
                socket.emit("username", "")
            }
        })

        socket.on("set_agree_screen", async (value) => {
            const userId = socket.user?.id
            if (!userId) return
            try {
                await pool.query("UPDATE users SET agree_screen = $1 WHERE id = $2", [value, userId])
            } catch {}
        })

        socket.on("get_agree_screen", async () => {
            const userId = socket.user?.id
            if (!userId) return
            try {
                const res = await pool.query("SELECT agree_screen FROM users WHERE id = $1", [userId])
                socket.emit("agree_screen", res.rows[0]?.agree_screen || false)
            } catch {
                socket.emit("agree_screen", false)
            }
        })

        socket.on('delete_message', async ({ id, withUserId }) => {
            if (!id) return
            try {
                const res = await pool.query(
                    'DELETE FROM messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)',
                    [id, socket.user.id]
                )
                if (res.rowCount) {
                    socket.emit('message_deleted', { id })
                    const receiverSocketId = userSockets.get(withUserId)
                    if (receiverSocketId) io.to(receiverSocketId).emit('message_deleted', { id })
                }
            } catch {}
        })

        socket.on("read_message", async ({ id, withUserId }) => {
            const userId = socket.user.id
            await pool.query("UPDATE messages SET read = true WHERE id = $1 AND receiver_id = $2", [id, userId])
            socket.emit("message_read", { id })
            const receiverSocketId = userSockets.get(withUserId)
            if (receiverSocketId) io.to(receiverSocketId).emit("message_read", { id })
        })

        socket.on("edit_message", async ({ id, content, withUserId }) => {
            if (!id || !content) return
            const userId = socket.user.id
            try {
                const res = await pool.query(
                    "UPDATE messages SET content = $1, edited = TRUE WHERE id = $2 AND sender_id = $3 RETURNING *",
                    [content, id, userId]
                )
                if (!res.rowCount) return
                const message = {
                    ...res.rows[0],
                    content,
                    id: res.rows[0].id.toString(),
                    created_at: res.rows[0].created_at.toISOString()
                }
                socket.emit("message_edited", message)
                const receiverSocketId = userSockets.get(withUserId)
                if (receiverSocketId) io.to(receiverSocketId).emit("message_edited", message)
            } catch {}
        })

        socket.on("call_user", ({ to, offer }) => {
            const receiverSocketId = userSockets.get(to)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("incoming_call", {
                    from: socket.user.id,
                    username: socket.user.username,
                    offer
                })
            }
        })

        socket.on("answer_call", ({ to, answer }) => {
            const receiverSocketId = userSockets.get(to)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call_answered", { answer })
            }
        })

        socket.on("ice_candidate", ({ to, candidate }) => {
            const receiverSocketId = userSockets.get(to)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("ice_candidate", { candidate })
            }
        })

        socket.on("end_call", ({ to }) => {
            const receiverSocketId = userSockets.get(to)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call_ended")
            }
        })
    })
}