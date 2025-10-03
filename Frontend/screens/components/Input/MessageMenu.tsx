import React, { useEffect, useRef, useState } from "react"
import { View, Text, Pressable, StyleSheet, Animated, Dimensions } from "react-native"

interface Props {
    onDelete: () => void
    onEdit: () => void
    onReply: () => void
    onCopy: () => void
    x: number
    y: number
    visible: boolean
    isMy: boolean | undefined
}

export default function MessageMenu({ onDelete, onEdit, onReply, onCopy, x, y, visible, isMy }: Props) {
    const opacity = useRef(new Animated.Value(0)).current
    const [render, setRender] = useState(visible)

    useEffect(() => {
        if (visible) {
            setRender(true)
            Animated.timing(opacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true
            }).start()
        } else {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true
            }).start(() => setRender(false))
        }
    }, [visible])

    if (!render) return null

    const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
    const menuWidth = 140
    const menuHeight = 160
    const headerHeight = 60

    let left = x
    let top = y

    if (left + menuWidth > screenWidth) left = screenWidth - menuWidth - 10
    if (top + menuHeight > screenHeight) top = screenHeight - menuHeight - 10
    if (left < 10) left = 10
    if (top < headerHeight + 10) top = y + 30

    return (
        <Animated.View style={[styles.container, { left, top, opacity }]}>
            <Pressable style={styles.button} onPress={onDelete}>
                <Text style={styles.text}>Удалить</Text>
            </Pressable>
            {isMy && (
                <>
                    <View style={styles.separator} />
                    <Pressable style={styles.button} onPress={onEdit}>
                        <Text style={styles.text}>Изменить</Text>
                    </Pressable>
                </>
            )}
            <View style={styles.separator} />
            <Pressable style={styles.button} onPress={onReply}>
                <Text style={styles.text}>Ответить</Text>
            </Pressable>
            <View style={styles.separator} />
            <Pressable style={styles.button} onPress={onCopy}>
                <Text style={styles.text}>Копировать</Text>
            </Pressable>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        width: 140,
        backgroundColor: "#222",
        borderRadius: 6,
        flexDirection: "column",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        borderColor: "#555",
        borderWidth: 1,
        elevation: 1000,
        zIndex: 1000
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center"
    },
    separator: {
        height: 1,
        backgroundColor: "#555"
    },
    text: {
        color: "#eee",
        fontWeight: "600"
    }
})