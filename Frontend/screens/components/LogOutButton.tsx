import React, { useRef, useState } from "react"
import { View, Pressable, Text, Animated, StyleSheet } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

type Props = {
    icon: string
    label: string
    colors: [string, string]
    iconColor: string
    logOut: () => void
}

export default function LogOutButton({ icon, label, colors, iconColor, logOut }: Props) {
    const anim = useRef(new Animated.Value(0)).current
    const [visible, setVisible] = useState(false)

    const handlePress = () => {
        if (visible) return
        setVisible(true)
        Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            setTimeout(() => {
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }).start(() => setVisible(false))
            }, 4000)
        })
    }

    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 36] })

    return (
        <View style={styles.wrapper}>
            <Pressable
                onPress={handlePress}
                android_ripple={{ color: "rgba(255,255,255,0.12)", borderless: false }}
                style={({ pressed }) => [
                    styles.item,
                    { backgroundColor: pressed ? colors[1] : colors[0] }
                ]}
            >
                <View style={[styles.iconWrapper, { backgroundColor: colors[1], shadowColor: colors[1] }]}>
                    <Ionicons name={icon} size={24} color={iconColor} />
                </View>
                <Text style={[styles.itemText, { color: iconColor }]}>{label}</Text>
            </Pressable>

            {visible && (
                <Animated.View style={[styles.confirmWrapper, { transform: [{ translateY }] }]}>
                    <Pressable onPress={logOut} style={styles.confirmBtn}>
                        <Text style={styles.confirmText}>Вы уверены?</Text>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        marginBottom: 36
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 18,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 6,
        zIndex: 1
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 18,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 10
    },
    itemText: {
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.5,
        textShadowColor: "rgba(0,0,0,0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1.5,
        flexShrink: 1,
        flexWrap: "wrap"
    },
    confirmWrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 0
    },
    confirmBtn: {
        backgroundColor: "#b84f4f",
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 14,
        marginTop: 60,
        elevation: 6
    },
    confirmText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16
    }
})