import React, { useEffect, useRef, useState } from "react"
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated } from "react-native"
import { BlurView } from "@react-native-community/blur"
import {
    RTCView,
    mediaDevices,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate
} from "react-native-webrtc"
import Ionicons from "react-native-vector-icons/Ionicons"

import { RootStackParamList } from "../App"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import socket from "../server"

const { width, height } = Dimensions.get("window")

type CallScreenProps = NativeStackScreenProps<RootStackParamList, "Call">

const Particle = () => {
    const posX = useRef(new Animated.Value(Math.random() * width)).current
    const posY = useRef(new Animated.Value(Math.random() * height)).current
    const size = 6 + Math.random() * 8
    const opacity = 0.12 + Math.random() * 0.2
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(posX, {
                        toValue: Math.random() * width,
                        duration: 6000 + Math.random() * 3000,
                        useNativeDriver: true
                    }),
                    Animated.timing(posY, {
                        toValue: Math.random() * height,
                        duration: 6000 + Math.random() * 3000,
                        useNativeDriver: true
                    })
                ]),
                Animated.delay(400)
            ])
        ).start()
    }, [posX, posY])
    return (
        <Animated.View
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: `rgba(13, 110, 253, ${opacity})`,
                transform: [{ translateX: posX }, { translateY: posY }],
                zIndex: 0
            }}
        />
    )
}

export default function CallScreen({ route, navigation }: CallScreenProps) {
    const { userId, incoming, offer } = route.params
    const [localStream, setLocalStream] = useState<any | null>(null)
    const [remoteStream, setRemoteStream] = useState<any | null>(null)
    const pcRef = useRef<any | null>(null)

    useEffect(() => {
        startCall()
        return () => {
            endCall()
            socket.off("call_answered", onCallAnswered)
            socket.off("ice_candidate", onRemoteIce)
            socket.off("call_ended", onCallEnded)
        }
    }, [])

    const onCallAnswered = async ({ answer }: { answer: any }) => {
        if (!pcRef.current) return
        try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        } catch {}
    }

    const onRemoteIce = async ({ candidate }: { candidate: any }) => {
        if (!pcRef.current || !candidate) return
        try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch {}
    }

    const onCallEnded = () => {
        endCall()
        navigation.canGoBack() && navigation.goBack()
    }

    const startCall = async () => {
        const stream = await mediaDevices.getUserMedia({ audio: true, video: true })
        setLocalStream(stream)

        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })
        pcRef.current = pc

        stream.getTracks().forEach((track: any) => pc.addTrack(track, stream))

        ;(pc as any).addEventListener("track", (event: any) => {
            const s = event.streams && event.streams[0] ? event.streams[0] : null
            if (s) setRemoteStream(s)
        })

        ;(pc as any).addEventListener("addstream", (event: any) => {
            if (event.stream) setRemoteStream(event.stream)
        })

        ;(pc as any).addEventListener("icecandidate", (event: any) => {
            if (event.candidate) socket.emit("ice_candidate", { to: userId, candidate: event.candidate })
        })

        socket.on("call_answered", onCallAnswered)
        socket.on("ice_candidate", onRemoteIce)
        socket.on("call_ended", onCallEnded)

        if (incoming && offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(offer))
            const answerDesc = await pc.createAnswer()
            await pc.setLocalDescription(answerDesc)
            socket.emit("answer_call", { to: userId, answer: answerDesc })
        } else {
            const offerDesc = await pc.createOffer()
            await pc.setLocalDescription(offerDesc)
            socket.emit("call_user", { to: userId, offer: offerDesc })
        }
    }

    const endCall = () => {
        pcRef.current?.close()
        pcRef.current = null
        localStream?.getTracks().forEach((t: any) => t.stop())
        setLocalStream(null)
        setRemoteStream(null)
        socket.emit("end_call", { to: userId })
    }

    return (
        <View style={styles.container}>
            {[...Array(30)].map((_, i) => <Particle key={i} />)}
            <BlurView
                style={StyleSheet.absoluteFill}
                blurType="dark"
                blurAmount={30}
                reducedTransparencyFallbackColor="#0d0d0d"
                overlayColor="rgba(13, 13, 13, 0.95)"
            />
            {remoteStream && <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />}
            {localStream && <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" />}
            <View style={styles.controls}>
                <TouchableOpacity style={styles.controlBtn} activeOpacity={0.85}>
                    <Ionicons name="mic" size={26} color="#0d6efd" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlBtn} activeOpacity={0.85}>
                    <Ionicons name="camera" size={26} color="#0d6efd" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.endCallBtn} onPress={endCall} activeOpacity={0.9}>
                    <Ionicons name="call" size={32} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0d0d0d",
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center"
    },
    remoteVideo: {
        width: width * 0.85,
        height: height * 0.68,
        borderRadius: 20,
        backgroundColor: "#111",
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#0d6efd",
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        zIndex: 3
    },
    localVideo: {
        width: 140,
        height: 190,
        position: "absolute",
        top: 50,
        right: 25,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: "#0d6efd",
        backgroundColor: "#121212",
        elevation: 8,
        shadowColor: "#0d6efd",
        shadowOpacity: 0.6,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 4 },
        zIndex: 5
    },
    controls: {
        position: "absolute",
        bottom: 50,
        width: "80%",
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        backgroundColor: "rgba(20, 20, 20, 0.8)",
        borderRadius: 50,
        paddingVertical: 12,
        elevation: 10,
        shadowColor: "#0d6efd",
        shadowOpacity: 0.5,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        zIndex: 10
    },
    controlBtn: {
        backgroundColor: "#171717",
        borderRadius: 36,
        padding: 14,
        justifyContent: "center",
        alignItems: "center"
    },
    endCallBtn: {
        backgroundColor: "#ff3b3b",
        padding: 18,
        borderRadius: 44,
        elevation: 12,
        shadowColor: "#ff3b3b",
        shadowOpacity: 0.9,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 }
    }
})