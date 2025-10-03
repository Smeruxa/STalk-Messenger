import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet } from "react-native"
import Svg, { G, Path } from "react-native-svg"

const SIZE = 40
const STROKE_WIDTH = 4
const RADIUS = SIZE / 2 - STROKE_WIDTH * 2.5
const GAP_DEGREES = 30
const ARC_DEGREES = 40

const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (Math.PI / 180) * angle
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
    }
}

const createArc = (startAngle: number, sweepAngle: number) => {
    const start = polarToCartesian(SIZE / 2, SIZE / 2, RADIUS, startAngle)
    const end = polarToCartesian(SIZE / 2, SIZE / 2, RADIUS, startAngle + sweepAngle)
    const largeArc = sweepAngle > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export default function CircleMessages({ visible }: { visible: boolean }) {
    const opacity = useRef(new Animated.Value(0)).current
    const rotate = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 300,
            useNativeDriver: true
        }).start()
    }, [visible])

    useEffect(() => {
        if (!visible) return
        rotate.setValue(0)
        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true
            })
        ).start()
    }, [visible])

    const rotation = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"]
    })

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                { opacity, transform: [{ rotate: rotation }] }
            ]}
        >
            <Svg width={SIZE} height={SIZE}>
                <G>
                    {[0, 90, 180, 270].map((baseAngle, i) => (
                        <Path
                            key={i}
                            d={createArc(baseAngle + GAP_DEGREES / 2, ARC_DEGREES)}
                            stroke="#0af"
                            strokeWidth={STROKE_WIDTH}
                            strokeLinecap="round"
                            fill="none"
                            strokeOpacity={0.9}
                        />
                    ))}
                </G>
            </Svg>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 65,
        left: "50%",
        marginLeft: -SIZE / 2,
        width: SIZE,
        height: SIZE,
        zIndex: 10
    }
})