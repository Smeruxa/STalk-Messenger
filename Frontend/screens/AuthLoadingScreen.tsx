import React, { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import socket from "../server"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../App"

type Props = NativeStackScreenProps<RootStackParamList, "AuthLoading">

export default function AuthLoadingScreen({ navigation } : Props) {
    useEffect(() => {
        const checkAuth = async () => {
            const json = await AsyncStorage.getItem("auth")
            if (!json) {
                navigation.reset({ index: 0, routes: [{ name: "Login" }] })
                return
            }
            try {
                const { username, password } = JSON.parse(json)
                socket.connect()
                socket.emit("login", { username, password })

                socket.once("login_success", ({ token }) => {
                    socket.auth = { token }
                    socket.disconnect()
                    socket.connect()
                    navigation.reset({ index: 0, routes: [{ name: "Dialogs" }] })
                })

                socket.once("login_error", () => {
                    navigation.reset({ index: 0, routes: [{ name: "Login" }] })
                })
            } catch {
                navigation.reset({ index: 0, routes: [{ name: "Login" }] })
            }
        }

        checkAuth()
    }, [])

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
            <ActivityIndicator size="large" color="#fff" />
        </View>
    )
}