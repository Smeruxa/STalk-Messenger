import React, { useState } from "react"
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import socket from "../server"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../App"
import { SafeAreaView } from "react-native-safe-area-context"

type Props = NativeStackScreenProps<RootStackParamList, "Register">

export default function RegisterScreen({ navigation } : Props) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleRegister = () => {
        if (!username.trim() || !password.trim() || !confirm.trim()) {
            setError("Все поля обязательны")
            return
        }
        if (password !== confirm) {
            setError("Пароли не совпадают")
            return
        }

        setError("")
        setLoading(true)

        socket.auth = {}
        socket.connect()
        socket.once("connect", () => {
            socket.emit("register", { username, password })
        })

        socket.once("register_success", () => {
            setLoading(false)
            socket.disconnect()
            navigation.navigate("Login")
        })

        socket.once("register_error", err => {
            setLoading(false)
            setError(err || "Ошибка регистрации")
            socket.disconnect()
        })

        socket.once("connect_error", err => {
            setLoading(false)
            setError(err?.message || "Ошибка подключения")
        })
    }


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <Text style={styles.logo}>Регистрация</Text>
                <View style={styles.form}>
                    <TextInput style={styles.input} placeholder="Имя пользователя" placeholderTextColor="#aaa" value={username} onChangeText={setUsername} editable={!loading} />
                    <View style={styles.passwordWrapper}>
                        <TextInput style={styles.passwordInput} placeholder="Пароль" placeholderTextColor="#aaa" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={!loading} />
                        <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#888" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.passwordWrapper}>
                        <TextInput style={styles.passwordInput} placeholder="Повторите пароль" placeholderTextColor="#aaa" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} editable={!loading} />
                    </View>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? "Создание..." : "Создать аккаунт"}</Text>
                    </Pressable>
                    <Pressable style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading}>
                        <Text style={styles.backButtonText}>Назад</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0d0d0d", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
    logo: { fontSize: 42, fontWeight: "700", color: "#fff", marginBottom: 40 },
    form: { width: "100%", maxWidth: 400 },
    input: { backgroundColor: "#1a1a1a", color: "#fff", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: "#333", marginBottom: 12 },
    passwordWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", borderRadius: 10, borderWidth: 1, borderColor: "#333", marginBottom: 12 },
    passwordInput: { flex: 1, color: "#fff", paddingVertical: 14, paddingHorizontal: 16, fontSize: 16 },
    eyeButton: { paddingHorizontal: 16, paddingVertical: 14 },
    button: { backgroundColor: "#3f51b5", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    backButton: { marginTop: 14, alignItems: "center" },
    backButtonText: { color: "#aaa", fontSize: 15 },
    error: { color: "#f66", marginBottom: 8, textAlign: "center" }
})