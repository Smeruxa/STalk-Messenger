// EmojiPanel.tsx
import React, { memo } from "react"
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native"

const emojis = [
    "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙",
    "😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁",
    "☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥",
    "❤️","⚡","❌"
]

const EmojiButton = memo(({ emoji, onPress }: { emoji: string; onPress: (e: string) => void }) => (
    <TouchableOpacity onPress={() => onPress(emoji)} style={styles.emojiButton} activeOpacity={0.7}>
        <Text style={styles.emojiText}>{emoji}</Text>
    </TouchableOpacity>
))

export default function EmojiPanel({ onSelect }: { onSelect: (emoji: string) => void }) {
    return (
        <View style={styles.emojiPanel}>
            <ScrollView contentContainerStyle={styles.emojiWrap} keyboardShouldPersistTaps="handled">
                {emojis.map(e => <EmojiButton key={e} emoji={e} onPress={onSelect} />)}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    emojiPanel: {
        maxHeight: 250,
        backgroundColor: "#1a1a1a",
        borderTopWidth: 1,
        borderTopColor: "#333"
    },
    emojiWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        padding: 10
    },
    emojiButton: {
        width: "11%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 6
    },
    emojiText: {
        fontSize: 24
    }
})