import React, { useRef } from "react"
import { View, Text, StyleSheet, Animated, PanResponder, GestureResponderEvent, Pressable } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

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

export default function MessageItem({
    item,
    onPress,
    onSwipeReply
}: {
    item: Message
    onPress: (e: GestureResponderEvent) => void
    onSwipeReply?: (item: Message) => void
}) {
    const translateX = useRef(new Animated.Value(0)).current
    const replyTriggered = useRef(false)

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 10,
            onPanResponderMove: (_, g) => {
                const dx = g.dx
                translateX.setValue(Math.max(Math.min(dx, 0), -40))
                replyTriggered.current = dx <= -20
            },
            onPanResponderRelease: () => {
                if (replyTriggered.current && onSwipeReply) {
                    console.log("Test")
                    onSwipeReply(item)
                }
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 10 }).start()
                replyTriggered.current = false
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 10 }).start()
                replyTriggered.current = false
            }
        })
    ).current

    return (
        <View style={{ flexDirection: "row", justifyContent: item.fromMe ? "flex-end" : "flex-start" }}>
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.message,
                    item.fromMe ? styles.myMessage : styles.theirMessage,
                    { transform: [{ translateX }] }
                ]}
            >
                <Pressable onPress={onPress} style={{ minWidth: 60 }}>
                    {item.reply_to && item.reply_text && (
                        <View style={styles.replyContainer}>
                            <View style={styles.replyLine} />
                            <View style={styles.replyContent}>
                                <Text style={styles.replyUser} numberOfLines={1} ellipsizeMode="clip">
                                    {item.reply_user_name}
                                </Text>
                                <Text style={styles.replyText} numberOfLines={1} ellipsizeMode="tail">
                                    {item.reply_text}
                                </Text>
                            </View>
                        </View>
                    )}
                    <Text style={item.fromMe ? styles.myMessageText : styles.theirMessageText}>{item.text}</Text>
                    <View style={styles.meta}>
                        <Text style={styles.time}>{item.time}</Text>
                        {item.edited && <Ionicons name="pencil" size={10} style={styles.icon} />}
                        <Ionicons name={item.read ? "checkmark-done" : "checkmark"} size={14} style={styles.icon} />
                    </View>
                </Pressable>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    message: {
        maxWidth: "70%",
        marginVertical: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16
    },
    myMessage: {
        backgroundColor: "#0a84ff",
        borderTopRightRadius: 0
    },
    theirMessage: {
        backgroundColor: "#2c2c2c",
        borderTopLeftRadius: 0
    },
    myMessageText: {
        color: "#fff",
        fontSize: 16
    },
    theirMessageText: {
        color: "#eee",
        fontSize: 16
    },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 4
    },
    time: {
        fontSize: 12,
        color: "#d0e6ff"
    },
    icon: {
        marginTop: 2,
        marginLeft: 4,
        color: "#fff"
    },
    replyContainer: {
        flexDirection: "row",
        marginBottom: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: "#1e293b",
        borderRadius: 12
    },
    replyLine: {
        width: 4,
        backgroundColor: "#4f8cff",
        borderRadius: 2,
        marginRight: 8
    },
    replyContent: {
        flexDirection: "column",
        flexWrap: "nowrap",
        alignItems: "flex-start",
    },
    replyUser: {
        fontSize: 13,
        fontWeight: "600",
        color: "#a3c1ff",
        flexShrink: 0,
        flexGrow: 0,
        flexWrap: "nowrap",
        maxWidth: "100%",
        includeFontPadding: false
    },
    replyText: {
        fontSize: 14,
        color: "#cbd5e1",
        flexShrink: 1,
        flexGrow: 1,
        maxWidth: "80%"
    },
})