import React, { useState } from "react"
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Ionicons from "react-native-vector-icons/Ionicons"
import socket from "../server"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../App"
import { SafeAreaView } from "react-native-safe-area-context"

type Props = NativeStackScreenProps<RootStackParamList, "Login">

export default function LoginScreen({ navigation }: Props) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = () => {
        if (!username.trim() || !password.trim()) {
            setError("Введите имя и пароль")
            return
        }
        setError("")
        setLoading(true)

        socket.connect()

        socket.emit("login", { username, password })

        const cleanup = () => {
            socket.off("login_success")
            socket.off("login_error")
            socket.off("connect_error")
        }

        socket.once("login_success", async ({ token, userId }) => {
            cleanup()
            setLoading(false)
            setError("")
            socket.auth = { token }
            socket.disconnect()
            socket.connect()

            await AsyncStorage.setItem("auth", JSON.stringify({ username, password, token, userId }))
            navigation.reset({ index: 0, routes: [{ name: "Dialogs" }] })
        })

        socket.once("login_error", err => {
            cleanup()
            setLoading(false)
            setError(err || "Ошибка авторизации")
        })

        socket.once("connect_error", err => {
            cleanup()
            setLoading(false)
            setError(err?.message || "Ошибка подключения")
        })
    }

    const handleRegister = () => {
        navigation.navigate("Register")
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Text style={styles.logo}>STalk</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Имя пользователя"
                        placeholderTextColor="#aaa"
                        value={username}
                        onChangeText={setUsername}
                        editable={!loading}
                    />

                    <View style={styles.passwordWrapper}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Пароль"
                            placeholderTextColor="#aaa"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                size={22}
                                color="#888"
                            />
                        </TouchableOpacity>
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? "Вход..." : "Войти"}</Text>
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.secondaryText}>Зарегистрироваться</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0d0d0d",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24
    },
    logo: {
        fontSize: 48,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 50
    },
    form: {
        width: "100%",
        maxWidth: 400
    },
    input: {
        backgroundColor: "#1a1a1a",
        color: "#fff",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#333",
        marginBottom: 12
    },
    passwordWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1a1a1a",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#333",
        marginBottom: 12
    },
    passwordInput: {
        flex: 1,
        color: "#fff",
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16
    },
    eyeButton: {
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    button: {
        backgroundColor: "#3f51b5",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 4
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600"
    },
    secondaryButton: {
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 16
    },
    secondaryText: {
        color: "#888",
        fontSize: 15
    },
    error: {
        color: "#f66",
        marginBottom: 8,
        textAlign: "center"
    }
})