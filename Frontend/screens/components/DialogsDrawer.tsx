import React, { useRef, useEffect, useMemo } from "react"
import {
    View,
    Text,
    Pressable,
    Animated,
    Dimensions,
    StyleSheet,
    Linking
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { SafeAreaView } from "react-native-safe-area-context"
import LinearGradient from "react-native-linear-gradient"
import LogOutButton from "./LogOutButton"

const { width } = Dimensions.get("window")
const DRAWER_WIDTH = width * 0.7
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient)

type Props = {
    drawerAnim: Animated.Value
    isDrawerOpen: boolean
    toggleDrawer: () => void
    logOut: () => void
    navigateConfident: () => void
    navigatePersonal: () => void
}

const buttonGradients = [
    { colors: ["#556270", "#6F8295"], iconColor: "#E0E6F8" },
    { colors: ["#8D8741", "#bdb577ff"], iconColor: "#F1F3B5" },
    { colors: ["#B5838D", "#D6A4A4"], iconColor: "#FFF1F3" }
]

const footerButtons = [
    {
        label: "Тех. поддержка",
        url: "https://t.me/smeruxa",
        colors: ["#2a3a4a", "#415a75"],
        icon: "headset-outline"
    },
    {
        label: "Оставить отзыв",
        url: "https://www.rustore.ru/catalog/app/com.stalk",
        colors: ["#4a2a3a", "#754165"],
        icon: "star-outline"
    }
]

export default function DialogsDrawer({
    drawerAnim,
    isDrawerOpen,
    toggleDrawer,
    logOut,
    navigateConfident,
    navigatePersonal
}: Props) {
    const anim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 9000, useNativeDriver: false }),
                Animated.timing(anim, { toValue: 0, duration: 9000, useNativeDriver: false })
            ])
        ).start()
    }, [anim])

    const gradientStart = { x: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }), y: 0 }
    const gradientEnd = { x: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), y: 1 }

    const menuItems = useMemo(
        () => [
            { icon: "person-outline", label: "Личные данные", action: navigatePersonal },
            { icon: "shield-checkmark-outline", label: "Конфиденциальность", action: navigateConfident }
        ],
        [navigatePersonal, navigateConfident]
    )

    return (
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            <AnimatedGradient
                colors={["#121212", "#1a1a1a", "#222222"]}
                start={gradientStart}
                end={gradientEnd}
                style={styles.gradient}
            />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable
                        onPress={toggleDrawer}
                        android_ripple={{ color: "#333", borderless: true }}
                        disabled={!isDrawerOpen}
                        style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                    >
                        <Ionicons name="close" size={28} color="#aaa" />
                    </Pressable>
                    <Text style={styles.title}>Меню</Text>
                </View>
                <View style={styles.list}>
                    {menuItems.map(({ icon, label, action }, i) => (
                        <Pressable
                            key={label}
                            onPress={action}
                            android_ripple={{ color: "rgba(255,255,255,0.12)", borderless: false }}
                            style={({ pressed }) => [
                                styles.item,
                                { backgroundColor: pressed ? buttonGradients[i].colors[1] : buttonGradients[i].colors[0] }
                            ]}
                        >
                            <View style={[styles.iconWrapper, { backgroundColor: buttonGradients[i].colors[1], shadowColor: buttonGradients[i].colors[1] }]}>
                                <Ionicons name={icon} size={24} color={buttonGradients[i].iconColor} />
                            </View>
                            <Text style={[styles.itemText, { color: buttonGradients[i].iconColor }]}>{label}</Text>
                        </Pressable>
                    ))}
                    <LogOutButton
                        icon="log-out-outline"
                        label="Выйти из аккаунта"
                        colors={["#B5838D", "#D6A4A4"]}
                        iconColor="#FFF1F3"
                        logOut={logOut}
                    />
                </View>
                <View style={styles.footer}>
                    {footerButtons.map(({ label, url, colors, icon }) => (
                        <Pressable
                            key={label}
                            onPress={() => Linking.openURL(url)}
                            android_ripple={{ color: "rgba(255,255,255,0.1)", borderless: false }}
                            style={({ pressed }) => [
                                styles.footerButton,
                                { backgroundColor: pressed ? colors[1] : colors[0] }
                            ]}
                        >
                            <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.footerButtonText}>{label}</Text>
                        </Pressable>
                    ))}
                </View>
            </SafeAreaView>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    drawer: {
        position: "absolute",
        top: 0,
        left: 0,
        width: DRAWER_WIDTH,
        height: "100%",
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 6, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 14,
        elevation: 24,
        zIndex: 4,
        backgroundColor: "#121212"
    },
    gradient: {
        ...StyleSheet.absoluteFillObject
    },
    container: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 48,
        justifyContent: "space-between"
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 44
    },
    closeBtn: {
        padding: 12,
        borderRadius: 28,
        backgroundColor: "rgba(18,18,18,1)",
        marginRight: 20,
        justifyContent: "center",
        alignItems: "center"
    },
    closeBtnPressed: {
        backgroundColor: "#333"
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#eee",
        letterSpacing: 1.4,
        textShadowColor: "rgba(0,0,0,0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    },
    list: {
        flex: 1,
        marginBottom: 24
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 18,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 6
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
        flexWrap: "wrap",
        maxWidth: DRAWER_WIDTH - 36 - 18 - 40
    },
    footer: {
        flexDirection: "column",
        gap: 1,
        paddingBottom: 12
    },
    footerButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 14,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        marginBottom: 12
    },
    footerButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14
    }
})