import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"

interface Props {
    name: string
    text: string
    onClose: () => void
}

export default function ReplyPreview({ name, text, onClose }: Props) {
    const translateY = useRef(new Animated.Value(60)).current
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            })
        ]).start()
    }, [])

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 60,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            })
        ]).start(() => onClose())
    }

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
            <View style={styles.content}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">{text}</Text>
            </View>
            <Text style={styles.close} onPress={handleClose}>×</Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: "#1a1a1a",
        borderTopWidth: 1,
        borderTopColor: "#222"
    },
    content: {
        flex: 1,
        marginRight: 10
    },
    name: {
        color: "#0af",
        fontWeight: "600",
        fontSize: 14
    },
    message: {
        color: "#ccc",
        fontSize: 14
    },
    close: {
        color: "#aaa",
        fontSize: 22
    }
})