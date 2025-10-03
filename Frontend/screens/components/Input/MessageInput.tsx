import React from "react"
import { View, TextInput, TouchableOpacity, StyleSheet, NativeSyntheticEvent, TextInputSelectionChangeEventData } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"

interface Props {
    input: string
    onChange: (text: string) => void
    onSend: () => void
    onToggleEmoji: () => void
    onSelectionChange: (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => void
    edit: boolean
    editText: string
    isAnswer: boolean
}

export default function MessageInput({ input, onChange, onSend, onToggleEmoji, onSelectionChange, edit, editText, isAnswer }: Props) {
    return (
        <View style={[styles.inputContainer, {}]}>
            <TouchableOpacity onPress={onToggleEmoji}>
                <Ionicons name="happy-outline" size={26} color="#aaa" style={{ marginRight: 12 }} />
            </TouchableOpacity>
            <TextInput
                style={styles.input}
                value={edit ? editText : input}
                onChangeText={onChange}
                placeholder="Введите сообщение..."
                placeholderTextColor="#666"
                multiline
                onSelectionChange={onSelectionChange}
            />
            <TouchableOpacity onPress={onSend} style={styles.sendButton}>
                <Ionicons name={edit ? "checkmark-circle-outline" : "send"} size={edit ? 26 : 22} color="#0af" />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: "#222",
        backgroundColor: "#1a1a1a"
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 17,
        maxHeight: 100,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#1a1a1a",
        borderRadius: 0
    },
    sendButton: {
        marginLeft: 12
    }
})