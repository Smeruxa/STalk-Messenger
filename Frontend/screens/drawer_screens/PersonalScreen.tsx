import React, { useState, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Platform,
    Image
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../../App"
import Alert from "../components/Alert"
import socket from "../../server"
import { launchImageLibrary } from "react-native-image-picker"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { SafeAreaView } from "react-native-safe-area-context"

type Props = NativeStackScreenProps<RootStackParamList, "Personal">

export default function PersonalScreen({ navigation }: Props) {
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [avatarUri, setAvatarUri] = useState("https://smeruxa.tw1.ru/stalk_default/")
    const [username, setUsername] = useState("")

    const [alertVisible, setAlertVisible] = useState(false)
    const [alertMessage, setAlertMessage] = useState("")
    const [alertType, setAlertType] = useState<"error" | "success" | "info">("info")

    useEffect(() => {
        socket.emit("get_avatar")
        socket.on("avatar_url", (url) => {
            const fullUrl = url ? (url.startsWith("http") ? url : "https://smeruxa.ru" + url) : "https://smeruxa.tw1.ru/stalk_default/"
            setAvatarUri(fullUrl)
        })

        socket.emit("get_username")
        socket.once("username", (name: string) => setUsername(name))

        const onSuccess = () => {
            setAlertType("success")
            setAlertMessage("Пароль изменён")
            setAlertVisible(true)
            setOldPassword("")
            setNewPassword("")
            setConfirmPassword("")
        }
        const onError = (msg: string) => {
            setAlertType("error")
            setAlertMessage(msg)
            setAlertVisible(true)
        }
        socket.on("change_password_success", onSuccess)
        socket.on("change_password_error", onError)
        socket.on("avatar_update_success", () => {
            setAlertType("success")
            setAlertMessage("Аватар обновлён")
            setAlertVisible(true)
        })
        socket.on("avatar_update_error", (msg: string) => {
            setAlertType("error")
            setAlertMessage(msg)
            setAlertVisible(true)
        })

        return () => {
            socket.off("change_password_success", onSuccess)
            socket.off("change_password_error", onError)
            socket.off("avatar_url")
            socket.off("avatar_update_success")
            socket.off("avatar_update_error")
        }
    }, [])

    const onChangePassword = () => {
        if (newPassword !== confirmPassword) {
            setAlertType("error")
            setAlertMessage("Новый пароль и подтверждение пароля не совпадают")
            setAlertVisible(true)
            return
        }
        socket.emit("change_password", { oldPassword, newPassword })
    }

    const onPickAvatar = () => {
        launchImageLibrary({ mediaType: "photo", maxWidth: 512, maxHeight: 512, quality: 0.8 }, async (response) => {
            if (response.didCancel) return
            if (response.errorCode) {
                setAlertType("error")
                setAlertMessage("Ошибка выбора изображения")
                setAlertVisible(true)
                return
            }
            if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0]
                if (!asset.uri) return
                setAvatarUri(asset.uri)
                const file = {
                    uri: asset.uri,
                    type: asset.type || "image/jpeg",
                    name: asset.fileName || "avatar.jpg"
                }
                const formData = new FormData()
                formData.append("avatar", file)
                const token = (socket.auth as { token?: string })?.token || ""
                try {
                    const res = await fetch("https://smeruxa.ru/stalk/upload-avatar", {
                        method: "POST",
                        body: formData,
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "multipart/form-data"
                        }
                    })
                    if (!res.ok) {
                        const text = await res.text()
                        setAlertType("error")
                        setAlertMessage(`Ошибка загрузки аватара: ${text || res.status}`)
                        setAlertVisible(true)
                    }
                } catch {
                    setAlertType("error")
                    setAlertMessage("Ошибка загрузки аватара")
                    setAlertVisible(true)
                }
            }
        })
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Личные данные</Text>
                <View style={{ width: 26 }} />
            </View>
            <KeyboardAwareScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
            >
                <View style={styles.avatarSection}>
                    <View style={styles.avatarRow}>
                        <TouchableOpacity style={styles.avatarWrapper} onPress={onPickAvatar}>
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            <View style={styles.editIconWrapper}>
                                <Ionicons name="camera-outline" size={24} color="#0a84ff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.username}>{username}</Text>
                    </View>
                </View>
                <View style={styles.passwordSection}>
                    <Text style={styles.sectionTitle}>Изменить пароль</Text>
                    <TextInput
                        placeholder="Старый пароль"
                        placeholderTextColor="#666"
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        autoCapitalize="none"
                    />
                    <TextInput
                        placeholder="Новый пароль"
                        placeholderTextColor="#666"
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        autoCapitalize="none"
                    />
                    <TextInput
                        placeholder="Подтвердить пароль"
                        placeholderTextColor="#666"
                        secureTextEntry={!showPassword}
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        autoCapitalize="none"
                    />
                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity style={styles.button} onPress={onChangePassword}>
                            <Text style={styles.buttonText}>Подтвердить</Text>
                            <TouchableOpacity
                                style={styles.eyeButtonOverlay}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={24}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>
            <Alert
                visible={alertVisible}
                message={alertMessage}
                type={alertType}
                onClose={() => setAlertVisible(false)}
            />
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
    content: {
        padding: 20
    },
    avatarSection: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#222",
        paddingBottom: 20
    },
    avatarRow: {
        flexDirection: "column",
        alignItems: "center",
        gap: 8
    },
    username: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "600",
        marginTop: 8
    },
    passwordSection: {
        paddingBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: "#222"
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 16,
        textAlign: "center"
    },
    input: {
        backgroundColor: "#222",
        color: "#fff",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        fontSize: 16
    },
    buttonWrapper: {
        flexDirection: "row",
        alignItems: "center"
    },
    button: {
        flex: 1,
        backgroundColor: "#0a84ff",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    buttonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "600"
    },
    eyeButtonOverlay: {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: [{ translateY: -12 }],
        padding: 10,
        paddingTop: 15,
        zIndex: 1
    },
    avatarWrapper: {
        alignSelf: "center",
        position: "relative"
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#444"
    },
    editIconWrapper: {
        position: "absolute",
        right: 0,
        bottom: 0,
        backgroundColor: "#0d0d0d",
        borderRadius: 16,
        padding: 4
    }
})