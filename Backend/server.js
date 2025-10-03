const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const setupSocket = require('./socket')
const uploadRouter = require('./upload-router')
const { UPLOAD_URL_PATH, UPLOAD_DIR } = require('./config')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: "*" },
    path: "/stalk/socket.io"
})

setupSocket(io)
app.use(uploadRouter)
app.use(UPLOAD_URL_PATH, express.static(UPLOAD_DIR))

server.listen(8000, () => console.log('Server started on port 8000'))