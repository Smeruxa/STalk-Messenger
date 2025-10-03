import React, { useState, useRef, useEffect, useCallback } from "react"
import Clipboard from "@react-native-clipboard/clipboard"
import { SafeAreaView } from "react-native-safe-area-context"

import {
    View,
    StyleSheet,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Animated,
    NativeModules,
    Pressable,
    ViewToken
} from "react-native"
import socket from "../server"
import AsyncStorage from "@react-native-async-storage/async-storage"
import CircleMessages from "./components/Input/CircleMessages"
import ScrollerDown from "./components/Input/ScrollerDown"
import EmojiPanel from "./components/Input/EmojiPanel"
import MessageItem from "./components/Input/MessageItem"
import MessageInput from "./components/Input/MessageInput"
import MessageMenu from "./components/Input/MessageMenu"
import Header from "./components/Input/Header"
import ReplyPreview from "./components/Input/ReplyPreview"
import KeyboardAvoidingWrapper from "./components/KeyboardAvoidingWrapper"
import { useEmojiInput } from "./hooks/EmojiUtils"

interface Message {
    id: string
    text: string
    fromMe: boolean
    time: string
    created_at: string
    read?: boolean
    edited?: boolean
    reply_to?: string | null
    reply_text?: string | null
    reply_user_name?: string | null
}

export default function InputScreen({ navigation, route }: any) {
    const { username, avatar, userId, screened } = route.params
    const [selfId, setSelfId] = useState<number | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [lastOnline, setLastOnline] = useState<string | null>(null)
    const [showScrollDown, setShowScrollDown] = useState(false)
    const [typingDots, setTypingDots] = useState(".")
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [circleVisible, setCircleVisible] = useState(false)
    const [isEditing, setEdit] = useState(false)
    const [connecting, setConnecting] = useState(true)
    const [connectDots, setConnectDots] = useState(".")
    const [editText, setEditText] = useState("")

    const [menuVisible, setMenuVisible] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

    const scrollAnim = useRef(new Animated.Value(0)).current
    const flatListRef = useRef<FlatList>(null)
    const isLoadingRef = useRef(false)
    const initialLoadRef = useRef(true)
    const replyRef = useRef(false)
    const typingTimeout = useRef<NodeJS.Timeout | null>(null)

    const formatTime = (d: string) => new Date(d).toTimeString().slice(0, 5)

    const buildMessage = (m: any): Message => ({
        id: m.id.toString(),
        text: m.content,
        fromMe: m.sender_id === selfId,
        time: formatTime(m.created_at),
        created_at: m.created_at,
        read: m.read,
        edited: m.edited,
        reply_to: m.reply_to,
        reply_text: m.reply_text || null,
        reply_user_name: m.reply_user_name || null,
    })
    
    useEffect(() => {
        const onMessageDeleted = ({ id }: { id: string }) => {
            setMessages(prev => prev.filter(m => m.id !== id))
        }
        socket.on("message_deleted", onMessageDeleted)
        return () => {
            socket.off("message_deleted", onMessageDeleted)
        }
    }, [])

    useEffect(() => {
        if (NativeModules.ScreenshotModule) {
            NativeModules.ScreenshotModule.allowScreenshots(Boolean(screened))
        }
    }, [screened])

    useEffect(() => {
        AsyncStorage.getItem("auth").then(authStr => {
            if (!authStr) return
            const auth = JSON.parse(authStr)
            setSelfId(auth.userId)
        })
    }, [])

    useEffect(() => {
        Animated.timing(scrollAnim, {
            toValue: showScrollDown ? 1 : 0,
            duration: 200,
            useNativeDriver: true
        }).start()
    }, [showScrollDown])

    useEffect(() => {
        socket.on("incoming_call", ({ from, offer }) => {
            navigation.navigate("Call", {
                selfId,
                userId: from,
                incoming: true,
                offer
            })
        })
        return () => {
            socket.off("incoming_call")
        }
    }, [selfId])

    useEffect(() => {
        if (selfId === null) return

        setConnecting(true)

        socket.emit("get_last_status", { withUserId: userId })
        loadMessages(true)

        const onMessages = (msgs: any[]) => {
            setConnecting(false)
            const newMsgs = msgs.map(buildMessage).reverse()

            setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id))
                const filtered = newMsgs.filter(m => !existingIds.has(m.id))
                return initialLoadRef.current ? filtered : [...prev, ...filtered]
            })

            if (msgs.length < 20) setHasMore(false)
            else setOffset(prev => prev + msgs.length)
            isLoadingRef.current = false
            initialLoadRef.current = false
            setTimeout(() => setCircleVisible(false), 300)
        }

        const onNewMessage = (msg: any) => {
            if (
                (msg.sender_id === selfId && msg.receiver_id === userId) ||
                (msg.sender_id === userId && msg.receiver_id === selfId)
            ) {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id.toString())) return prev
                    const newMsg = buildMessage(msg)
                    return [newMsg, ...prev]
                })
                setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50)
            }
        }

        const onTyping = ({ fromUserId }: { fromUserId: number }) => {
            if (fromUserId !== userId) return
            setIsTyping(true)
            if (typingTimeout.current) clearTimeout(typingTimeout.current)
            typingTimeout.current = setTimeout(() => setIsTyping(false), 1000)
        }

        const onStatus = ({ fromUserId, last_typing, last_online }: any) => {
            if (fromUserId !== userId) return
            setConnecting(false)
            if (last_typing && Date.now() - new Date(last_typing).getTime() < 2000) {
                setIsTyping(true)
            } else {
                setIsTyping(false)
                setLastOnline(new Date(last_online).toTimeString().slice(0, 5))
            }
        }

        const onEditMessage = (msg: any) => {
            setMessages(prev => prev.map(m => m.id === msg.id ? {
                ...m,
                text: msg.content,
                edited: msg.edited
            } : m))
        }

        socket.on("messages", onMessages)
        socket.on("new_message_channel", onNewMessage)
        socket.on("typing", onTyping)
        socket.on("last_status", onStatus)
        socket.on("message_edited", onEditMessage)

        return () => {
            socket.off("messages", onMessages)
            socket.off("new_message_channel", onNewMessage)
            socket.off("typing", onTyping)
            socket.off("last_status", onStatus)
            socket.off("message_edited", onEditMessage)
            if (typingTimeout.current) clearTimeout(typingTimeout.current)
            setSelectedMessage(null)
        }
    }, [selfId, userId])

    useEffect(() => {
        if (!connecting) return
        const interval = setInterval(() => {
            setConnectDots(prev => prev.length >= 3 ? "." : prev + ".")
        }, 400)
        return () => clearInterval(interval)
    }, [connecting])

    useEffect(() => {
        if (!isTyping) return
        const interval = setInterval(() => {
            setTypingDots(prev => (prev.length >= 3 ? "." : prev + "."))
        }, 400)
        return () => clearInterval(interval)
    }, [isTyping])

    useEffect(() => {
        if (!loadingMessages) return
        const timeout = setTimeout(() => setLoadingMessages(false), 1000)
        return () => clearTimeout(timeout)
    }, [messages])

    const onScroll = (e: any) => setShowScrollDown(e.nativeEvent.contentOffset.y > 50)
    const onEndReached = () => !initialLoadRef.current && loadMessages(false)
    const scrollToBottom = () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
        setShowScrollDown(false)
    }

    const { input, setInput, setSelection, addEmoji, showEmojis, toggleEmojiPanel } = useEmojiInput(scrollToBottom, editText, setEditText, isEditing)

    const sendMessage = () => {
        const content = isEditing ? editText.trim() : input.trim()
        if (!content) return

        if (isEditing) {
            socket.emit("edit_message", { id: selectedMessage?.id, content, withUserId: userId })
            setEditText("")
            setEdit(false)
            setSelectedMessage(null)
        }
        else {
            const reply_to = replyRef.current && selectedMessage ? selectedMessage.id : null
            socket.emit("send_message", { to: userId, content, reply_to })
            if (replyRef.current) {
                closeMenu()
                replyRef.current = false
                setSelectedMessage(null)
            }
            messages
                .filter(m => !m.fromMe && !m.read)
                .forEach(m => socket.emit("read_message", { id: m.id, withUserId: userId }))
            setMessages(prev => prev.map(m => m.fromMe ? m : { ...m, read: true }))
            setInput("")
            scrollToBottom()
        }
    }

    const loadMessages = (initial = false) => {
        if (!hasMore || isLoadingRef.current) return
        isLoadingRef.current = true
        if (!initial) {
            setCircleVisible(true)
            setLoadingMessages(true)
        }
        socket.emit("get_messages", {
            withUserId: userId,
            offset: initial ? 0 : offset,
            limit: 20
        })
    }

    const handleInputChange = (text: string) => {
        isEditing ? setEditText(text) : setInput(text)
        socket.emit("update_typing", { to: userId })
    }

    const handleMessagePress = (message: Message, y: number, x: number) => {
        setSelectedMessage(message)
        setMenuPosition({ x, y })
        setMenuVisible(true)
    }

    const closeMenu = () => {
        setMenuVisible(false)
        setSelectedMessage(null)
    }

    const deleteMessage = async () => {
        if (!selectedMessage) return
        socket.emit("delete_message", { id: selectedMessage.id, withUserId: userId })
        setMessages(prev => prev.filter(m => m.id !== selectedMessage.id))
        setOffset(prev => (prev > 0 ? prev - 1 : 0))
        closeMenu()
    }

    const editMessage = async () => {
        if (!selectedMessage) return
        setEditText(selectedMessage.text)
        setEdit(true)
        setMenuVisible(false)
    }

    const copyMessage = async () => {
        if (!selectedMessage) return
        Clipboard.setString(selectedMessage.text)
        closeMenu()
    }

    const onReplyMessage = async () => {
        if (!selectedMessage) return
        replyRef.current = true
        setMenuVisible(false)
    }

    useEffect(() => {
        socket.on("message_read", ({ id }: { id: string }) => {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
        })
        return () => { socket.off("message_read") }
    }, [])

    const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        viewableItems.forEach(({ item }) => {
            if (!item?.fromMe && !item.read) {
                socket.emit("read_message", { id: item.id, withUserId: userId })
            }
        })
    })

    const viewConfigRef = useRef({ itemVisiblePercentThreshold: 50 })

    const renderItem = useCallback(({ item }: { item: Message }) => (
        <MessageItem
            item={item}
            onPress={(e) => {
                const { pageX, pageY } = e.nativeEvent
                handleMessagePress(item, pageY - 60, pageX - 70)
            }}
            onSwipeReply={(msg) => {
                replyRef.current = true
                setSelectedMessage(msg)
            }}
        />
    ), [])

    const [keyboardVisible, setKeyboardVisible] = useState(false)

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))
        const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))
        return () => {
            showSub.remove()
            hideSub.remove()
        }
    }, [])

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
            <KeyboardAvoidingWrapper style={styles.container} >
                <Header
                    username={username}
                    avatar={avatar}
                    isTyping={connecting ? false : isTyping}
                    typingDots={connecting ? connectDots : typingDots}
                    lastOnline={connecting ? `подключение${connectDots}` : lastOnline}
                    onBack={() => navigation.goBack()}
                    onCall={() => {
                        navigation.navigate("Call", {
                            selfId,
                            userId,
                            incoming: false
                        })
                    }}
                />

                <CircleMessages visible={circleVisible || (loadingMessages && !initialLoadRef.current)} />

                {connecting && (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <CircleMessages visible />
                    </View>
                )}

                {!connecting && (
                    <FlatList
                        ref={flatListRef}
                        style={styles.messagesList}
                        data={messages} 
                        keyExtractor={(item, index) => `${item.id}_${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
                        onScroll={onScroll}
                        onViewableItemsChanged={onViewRef.current}
                        viewabilityConfig={viewConfigRef.current}
                        scrollEventThrottle={16}
                        keyboardShouldPersistTaps="always"
                        inverted
                        nestedScrollEnabled
                        onEndReachedThreshold={0.1}
                        onEndReached={onEndReached}
                    />
                )}

                <ScrollerDown show={showScrollDown} onPress={scrollToBottom} anim={scrollAnim} />

                {replyRef.current && selectedMessage && (
                    <ReplyPreview
                        name={selectedMessage.fromMe ? "Вы" : username}
                        text={selectedMessage.text}
                        onClose={() => {
                            replyRef.current = false
                            setSelectedMessage(null)
                        }}
                    />
                )}

                <View>
                    <MessageInput
                        input={input}
                        onChange={handleInputChange}
                        onSend={sendMessage}
                        onToggleEmoji={toggleEmojiPanel}
                        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                        edit={isEditing}
                        editText={editText}
                        isAnswer={replyRef.current}
                    />
                    {showEmojis && <EmojiPanel onSelect={addEmoji} />}
                </View>

                {menuVisible && (
                    <Pressable
                        style={StyleSheet.absoluteFill}
                        onPress={() => {
                            Keyboard.dismiss()
                            closeMenu()
                        }}
                    />
                )}

                <MessageMenu
                    visible={menuVisible}
                    x={menuPosition.x}
                    y={menuPosition.y}
                    onDelete={deleteMessage}
                    onEdit={editMessage}
                    onReply={onReplyMessage}
                    onCopy={copyMessage}
                    isMy={selectedMessage?.fromMe}
                />
            </KeyboardAvoidingWrapper>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0d0d0d"
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: "#0d0d0d"
    }
})