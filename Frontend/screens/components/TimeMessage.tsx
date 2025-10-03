import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, Animated } from "react-native"

export default function TimeMessage({ date }: { date: string | null }) {
    const [visible, setVisible] = useState(false)
    const opacity = useState(new Animated.Value(0))[0]

    useEffect(() => {
        if (!date) return
        setVisible(true)
        Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
        }).start()

        const timer = setTimeout(() => {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start(() => setVisible(false))
        }, 1000)

        return () => clearTimeout(timer)
    }, [date])

    if (!visible || !date) return null

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <Text style={styles.text}>{date}</Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 70,
        alignSelf: "center",
        backgroundColor: "#333",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        zIndex: 999
    },
    text: {
        color: "#fff",
        fontSize: 14
    }
})