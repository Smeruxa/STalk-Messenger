import React from "react"
import { Animated, StyleSheet, TouchableOpacity } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

interface Props {
    show: boolean
    onPress: () => void
    anim: Animated.Value
}

export default function ScrollerDown({ show, onPress, anim }: Props) {
    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [60, 0]
    })

    const opacity = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1]
    })

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity
                }
            ]}
            pointerEvents={show ? "auto" : "none"}
        >
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touch}>
                <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 70,
        right: 10
    },
    touch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1e1e1e",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#444"
    }
})