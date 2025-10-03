import React, { useState, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import socket from "../server"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../App"
import { SafeAreaView } from "react-native-safe-area-context"

type Props = NativeStackScreenProps<RootStackParamList, "Find">

interface User {
    id: number
    username: string
}

export default function FindScreen({ navigation }: Props) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<User[]>([])

    useEffect(() => {
        if (query.trim().length === 0) {
            setResults([])
            return
        }
        socket.emit("search_users", { query: query.trim() })
    }, [query])

    useEffect(() => {
        const onResults = (users: User[]) => {
            setResults(users)
        }
        socket.on("search_results", onResults)
        return () => {
            socket.off("search_results", onResults)
        }
    }, [])

    const openChat = (user: User) => {
        navigation.navigate("Input", {
            username: user.username,
            avatar: "https://smeruxa.tw1.ru/stalk_default/",
            userId: user.id
        })
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Поиск пользователей"
                        placeholderTextColor="#888"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                </View>
                <FlatList
                    data={results}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.userItem} onPress={() => openChat(item)}>
                            <Ionicons name="person-circle-outline" size={36} color="#0af" />
                            <Text style={styles.username}>{item.username}</Text>
                        </TouchableOpacity>
                    )}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={query.length > 0 ? <Text style={styles.noResults}>Пользователи не найдены</Text> : null}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0d0d0d",
        paddingTop: 10
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 8
    },
    input: {
        flex: 1,
        marginLeft: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#fff",
        backgroundColor: "#121212",
        borderRadius: 20
    },
    userItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomColor: "#222",
        borderBottomWidth: 1
    },
    username: {
        color: "#fff",
        fontSize: 18,
        marginLeft: 12
    },
    noResults: {
        color: "#888",
        textAlign: "center",
        marginTop: 20,
        fontSize: 16
    }
})