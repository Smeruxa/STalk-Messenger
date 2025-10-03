import React, { ReactNode } from "react"
import { KeyboardAvoidingView, Keyboard, Platform, StyleProp, ViewStyle, EmitterSubscription } from "react-native"

interface Props {
    children: ReactNode
    style?: StyleProp<ViewStyle>
    behavior?: "height" | "padding" | "position"
}

interface State {
    keyboardKey: string
}

export default class KeyboardAvoidingWrapper extends React.Component<Props, State> {
    private keyboardListener?: EmitterSubscription

    constructor(props: Props) {
        super(props)
        this.state = { keyboardKey: "keyboardAvoidingViewKey" }
        this.onKeyboardHide = this.onKeyboardHide.bind(this)
    }

    componentDidMount() {
        this.keyboardListener = Keyboard.addListener(
            Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide",
            this.onKeyboardHide
        )
    }

    componentWillUnmount() {
        this.keyboardListener?.remove()
    }

    onKeyboardHide() {
        this.setState({ keyboardKey: "keyboardAvoidingViewKey" + Date.now() })
    }

    render() {
        const { children, style, behavior = "height" } = this.props
        const { keyboardKey } = this.state

       return (
            <KeyboardAvoidingView
                behavior={behavior}
                style={style}
                keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            >
                {children}
            </KeyboardAvoidingView>
        )
    }
}
