import { useState, useCallback, useEffect, Dispatch, SetStateAction } from "react"
import { Keyboard, BackHandler } from "react-native"

export function useEmojiInput(scrollToBottom: () => void, editInput: string, setEditText: Dispatch<SetStateAction<string>>, isEditing: boolean) {
    const [input, setInput] = useState("")
    const [selection, setSelection] = useState({ start: 0, end: 0 })
    const [showEmojis, setShowEmojis] = useState(false)

    const addEmoji = useCallback((emoji: string) => {
        (isEditing ? setEditText : setInput)(prev => {
            const start = selection.start
            const end = selection.end
            const newText = prev.slice(0, start) + emoji + prev.slice(end)
            const cursorPos = start + emoji.length
            setSelection({ start: cursorPos, end: cursorPos })
            return newText
        })
    }, [selection])

    const toggleEmojiPanel = useCallback(() => {
        if (showEmojis) {
            setShowEmojis(false)
            setTimeout(() => Keyboard.dismiss(), 20)
        } else {
            Keyboard.dismiss()
            setTimeout(() => setShowEmojis(true), 20)
        }
    }, [showEmojis])

    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => setShowEmojis(false))
        return () => {
            showSub.remove()
        }
    }, [scrollToBottom])

    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            if (showEmojis) {
                setShowEmojis(false)
                return true
            }
            return false
        })
        return () => sub.remove()
    }, [showEmojis])

    return {
        input,
        setInput,
        selection,
        setSelection,
        addEmoji,
        showEmojis,
        toggleEmojiPanel,
        setShowEmojis
    }
}