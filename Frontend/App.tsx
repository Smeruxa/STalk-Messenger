import * as React from "react"
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import socket from "./server" 
import LoginScreen from "./screens/LoginScreen"
import RegisterScreen from "./screens/RegisterScreen"
import DialogsScreen from "./screens/DialogsScreen"
import AuthLoadingScreen from "./screens/AuthLoadingScreen"
import InputScreen from "./screens/InputScreen"
import FindScreen from "./screens/FindScreen"
import ConfidentScreen from "./screens/drawer_screens/ConfidentScreen"
import PersonalScreen from "./screens/drawer_screens/PersonalScreen"
import CallScreen from "./screens/CallScreen"

export const navigationRef = createNavigationContainerRef<RootStackParamList>()
export type RootStackParamList = {
    AuthLoading: undefined
    Login: undefined
    Register: undefined
    Dialogs: undefined
    Find: undefined
    Confident: undefined
    Personal: undefined
    Input: { username: string; avatar: string; userId: any },
    Call: {
        selfId: number
        userId: number
        incoming?: boolean
        offer?: { type: string; sdp: string }
    }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator initialRouteName="AuthLoading" screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
                <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Dialogs" component={DialogsScreen} />
                <Stack.Screen name="Input" component={InputScreen} />
                <Stack.Screen name="Find" component={FindScreen} />
                <Stack.Screen name="Confident" component={ConfidentScreen} />
                <Stack.Screen name="Personal" component={PersonalScreen} />
                <Stack.Screen name="Call" component={CallScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}