import React, { useEffect } from "react"
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

type AlertProps = {
    visible: boolean
    message: string
    type?: "error" | "success" | "info"
    onClose: () => void
    duration?: number
}

export default function Alert({ visible, message, type = "info", onClose, duration = 3000 }: AlertProps) {
    const opacity = React.useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start()
            const timer = setTimeout(() => {
                Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onClose())
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [visible])

    if (!visible) return null

    const bgColor =
        type === "error" ? "#f44336" :
        type === "success" ? "#4caf50" :
        "#2196f3"

    return (
        <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity }]}>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 }
    },
    message: {
        color: "#fff",
        fontSize: 16,
        flex: 1
    }
})