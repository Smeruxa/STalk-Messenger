import { io } from "socket.io-client"

const socket = io("", {
    path: "/stalk/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000
})

export default socket