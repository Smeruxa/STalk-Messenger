import React, { useEffect, useRef } from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { BlurView } from "@react-native-community/blur"

export default function Header({ username, avatar, isTyping, typingDots, lastOnline, onBack, onCall }: {
    username: string
    avatar: string
    isTyping: boolean
    typingDots: string
    lastOnline: string | null
    onBack: () => void
    onCall: () => void
}) {
    const animLeft = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
    const animRight = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current

    useEffect(() => {
        const loopAnim = (anim: Animated.ValueXY, maxX: number, maxY: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: { x: Math.random() * maxX, y: Math.random() * maxY }, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                    Animated.timing(anim, { toValue: { x: Math.random() * maxX, y: Math.random() * maxY }, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
                ])
            ).start()
        }
        loopAnim(animLeft, 30, 30)
        loopAnim(animRight, 30, 30)
    }, [])

    return (
        <View style={styles.headerContainer}>
            <Animated.View style={[styles.circle, { left: 40, top: 10, backgroundColor: "#ff69b4", transform: animLeft.getTranslateTransform() }]} />
            <Animated.View style={[styles.circle, { right: 40, top: 10, backgroundColor: "#1e90ff", transform: animRight.getTranslateTransform() }]} />
            <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor="black" />
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                    <View>
                        <Text style={styles.username}>{username}</Text>
                        <Text style={styles.statusText}>
                            {isTyping ? `печатает${typingDots}` : lastOnline ? `был(а) в ${lastOnline}` : ""}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={onCall}>
                    <Ionicons name="call-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    headerContainer: { height: 60, overflow: "hidden", position: "relative" },
    header: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        backgroundColor: "transparent",
        borderBottomWidth: 1,
        borderBottomColor: "#222",
        justifyContent: "space-between",
        paddingTop: Platform.OS === "ios" ? 20 : 0,
        zIndex: 1
    },
    userInfo: { flexDirection: "row", alignItems: "center" },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    username: { color: "#fff", fontSize: 18, fontWeight: "600" },
    statusText: { color: "#aaa", fontSize: 14 },
    circle: { position: "absolute", width: 100, height: 100, borderRadius: 50, opacity: 0.25, zIndex: 0 }
})