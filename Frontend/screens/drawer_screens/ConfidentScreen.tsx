import React, { useState, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../../App"
import socket from "../../server"
import { SafeAreaView } from "react-native-safe-area-context"

type Props = NativeStackScreenProps<RootStackParamList, "Confident">

export default function ConfidentScreen({ navigation }: Props) {
    const [isVisible, setIsVisible] = useState(false)
    const knobAnim = useState(new Animated.Value(0))[0]
    const [agreeScreen, setAgreeScreen] = useState(false)
    const agreeAnim = useState(new Animated.Value(0))[0]

    useEffect(() => {
        const handleCanShow = (val: boolean) => {
            setIsVisible(val)
            knobAnim.setValue(val ? 1 : 0)
        }

        socket.emit("get_can_show")
        socket.on("can_show", handleCanShow)

        socket.emit("get_agree_screen")
        socket.on("agree_screen", (val: boolean) => {
            setAgreeScreen(val)
            agreeAnim.setValue(val ? 1 : 0)
        })

        return () => {
            socket.off("can_show", handleCanShow)
            socket.off("agree_screen")
        }
    }, [])


    const toggleSwitch = async () => {
        const newValue = !isVisible
        setIsVisible(newValue)
        Animated.timing(knobAnim, {
            toValue: newValue ? 1 : 0,
            duration: 200,
            easing: Easing.out(Easing.circle),
            useNativeDriver: false
        }).start()
        socket.emit("set_can_show", newValue)
    }

    const toggleAgree = async () => {
        const newValue = !agreeScreen
        setAgreeScreen(newValue)
        Animated.timing(agreeAnim, {
            toValue: newValue ? 1 : 0,
            duration: 200,
            easing: Easing.out(Easing.circle),
            useNativeDriver: false
        }).start()
        socket.emit("set_agree_screen", newValue)
    }

    const agreePos = agreeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 32]
    })

    const agreeBg = agreeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#444", "#0a84ff"]
    })

    const interpolatedPosition = knobAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 32]
    })

    const interpolatedBg = knobAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#444", "#0a84ff"]
    })

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={26} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Конфиденциальность</Text>
                    <View style={{ width: 26 }} />
                </View>
                <View style={styles.item}>
                    <Text style={styles.label}>Отображаться в поиске</Text>
                    <TouchableOpacity activeOpacity={1} onPress={toggleSwitch}>
                        <Animated.View style={[styles.switchTrack, { backgroundColor: interpolatedBg }]}>
                            <Animated.View style={[styles.knob, { left: interpolatedPosition }]} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
                <View style={styles.item}>
                    <Text style={styles.label}>Разрешить скриншот чата</Text>
                    <TouchableOpacity activeOpacity={1} onPress={toggleAgree}>
                        <Animated.View style={[styles.switchTrack, { backgroundColor: agreeBg }]}>
                            <Animated.View style={[styles.knob, { left: agreePos }]} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0d0d0d"
    },
    header: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        backgroundColor: "#1a1a1a",
        borderBottomWidth: 1,
        borderBottomColor: "#222"
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff"
    },
    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#222"
    },
    label: {
        color: "#fff",
        fontSize: 16
    },
    switchTrack: {
        width: 60,
        height: 30,
        borderRadius: 20,
        justifyContent: "center",
        padding: 2
    },
    knob: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: "#fff",
        position: "absolute",
        top: 2
    }
})
