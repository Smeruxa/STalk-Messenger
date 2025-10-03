import React, { useState, useEffect, useRef } from "react"
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    BackHandler, 
    ToastAndroid,
    Easing
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Ionicons from "react-native-vector-icons/Ionicons"
import socket from "../server"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../App"
import DialogsDrawer from "./components/DialogsDrawer"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "@react-native-community/blur"

const { width } = Dimensions.get("window")

type Props = NativeStackScreenProps<RootStackParamList, "Dialogs">

export default function DialogsScreen({ navigation }: Props) {
    const [dialogs, setDialogs] = useState<any[]>([])
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const drawerAnim = useState(new Animated.Value(-width * 0.7))[0]

    const anim1 = useRef(new Animated.Value(0)).current
    const anim2 = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim1, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(anim1, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
            ])
        ).start()
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim2, { toValue: 1, duration: 10000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(anim2, { toValue: 0, duration: 10000, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
            ])
        ).start()
    }, [])

    const translateX1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [-200, width / 2 - 100] })
    const translateX2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [width, width / 2 - 100] })

    const fetchDialogs = () => socket.emit("get_dialogs")
    useEffect(() => {
        fetchDialogs()
        socket.on("dialogs", setDialogs)
        const onNewMessage = () => fetchDialogs()
        socket.on("new_message_channel", onNewMessage)
        return () => {
            socket.off("dialogs", setDialogs)
            socket.off("new_message_channel", onNewMessage)
        }
    }, [])

    useEffect(() => {
        let backPressedOnce = false
        const onBackPress = () => {
            if (backPressedOnce) return false
            backPressedOnce = true
            ToastAndroid.show("Нажмите еще раз, чтобы закрыть", ToastAndroid.SHORT)
            setTimeout(() => backPressedOnce = false, 2000)
            return true
        }
        const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress)
        return () => backHandler.remove()
    }, [])

    const toggleDrawer = () => {
        Animated.timing(drawerAnim, {
            toValue: isDrawerOpen ? -width * 0.7 : 0,
            duration: 250,
            useNativeDriver: true
        }).start()
        setIsDrawerOpen(!isDrawerOpen)
    }

    const logOut = async () => {
        await AsyncStorage.removeItem("auth")
        socket.auth = {}
        socket.disconnect()
        navigation.reset({ index: 0, routes: [{ name: "Login" }] })
    }

    const onOutsidePress = () => {
        if (isDrawerOpen) toggleDrawer()
    }

    const navigateConfident = () => {
        navigation.navigate("Confident")
    }

    const navigatePersonal = () => {
        navigation.navigate("Personal")
    }

    const DialogItem = ({ item, isDrawerOpen, navigation }: any) => {
        const [avatarUri, setAvatarUri] = React.useState("https://smeruxa.tw1.ru/stalk_default/")
        React.useEffect(() => {
            if (!item.avatar) return
            const url = "https://smeruxa.ru" + item.avatar
            fetch(url, { method: "HEAD" })
                .then(res => res.ok ? setAvatarUri(url) : setAvatarUri("https://smeruxa.tw1.ru/stalk_default/"))
                .catch(() => setAvatarUri("https://smeruxa.tw1.ru/stalk_default/"))
        }, [item.avatar])

        return (
            <TouchableOpacity
                style={styles.dialog}
                disabled={isDrawerOpen}
                onPress={() => navigation.navigate("Input", {
                    username: item.username,
                    avatar: avatarUri,
                    userId: item.id,
                    screened: item.agree_screen
                })}
            >
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                <View style={styles.texts}>
                    <View style={styles.headerRow}>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.time}>{new Date(item.created_at).toTimeString().slice(0, 5)}</Text>
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>{item.content}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
            <View style={styles.container}>
                <DialogsDrawer drawerAnim={drawerAnim} isDrawerOpen={isDrawerOpen} toggleDrawer={toggleDrawer} logOut={logOut} navigateConfident={navigateConfident} navigatePersonal={navigatePersonal} />
                {isDrawerOpen && <View style={styles.overlay} pointerEvents="none" />}
                <TouchableWithoutFeedback onPress={onOutsidePress}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.headerContainer}>
                            <Animated.View style={[styles.circle, { backgroundColor: "#ff69b4", left: 0, transform: [{ translateX: translateX1 }] }]} />
                            <Animated.View style={[styles.circle, { backgroundColor: "#1e90ff", left: 0, transform: [{ translateX: translateX2 }] }]} />
                            <BlurView style={styles.blur} blurType="dark" blurAmount={20} reducedTransparencyFallbackColor="black" />
                            <View style={styles.header}>
                                <TouchableOpacity onPress={toggleDrawer} disabled={isDrawerOpen}>
                                    <Ionicons name="menu-outline" size={26} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.title}>STalk</Text>
                                <TouchableOpacity onPress={() => navigation.navigate("Find")}>
                                    <Ionicons name="search-outline" size={26} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <FlatList
                            data={dialogs}
                            keyExtractor={item => item.id.toString()}
                            scrollEnabled={!isDrawerOpen}
                            renderItem={({ item }) => <DialogItem item={item} isDrawerOpen={isDrawerOpen} navigation={navigation} />}
                            contentContainerStyle={{ paddingVertical: 8 }}
                        />
                    </View>
                </TouchableWithoutFeedback>
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
        borderBottomWidth: 1,
        borderBottomColor: "#222",
        zIndex: 1
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff"
    },
    dialog: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e"
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16
    },
    texts: {
        flex: 1
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    username: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "600",
        marginBottom: 4
    },
    time: {
        color: "#aaa",
        fontSize: 13,
        fontWeight: "500"
    },
    lastMessage: {
        color: "#aaa",
        fontSize: 15
    },
    headerContainer: {
        height: 60,
        overflow: "hidden",
        position: "relative"
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0
    },
    circle: {
        position: "absolute",
        top: -70,
        width: 200,
        height: 200,
        borderRadius: 100,
        opacity: 0.25,
        zIndex: -1
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "black",
        position: "absolute",
        opacity: 0.4,
        zIndex: 2,
        top: 60
    }
})