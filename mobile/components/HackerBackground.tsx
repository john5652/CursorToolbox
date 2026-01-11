import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// Hacker-style code snippets
const CODE_LINES = [
  'const data = extractMetadata(file);',
  'function decrypt() { return key; }',
  'class System { init() {} }',
  'if (status === "online") { connect(); }',
  'const matrix = [1, 0, 1, 0];',
  'function hack() { return true; }',
  'const protocol = "cyber://";',
  'class Network { ping() {} }',
  'const token = generateAuth();',
  'function scan() { return ports; }',
  'const binary = 0b101010;',
  'class Security { encrypt() {} }',
  'if (access === "granted") { proceed(); }',
  'const hash = sha256(data);',
  'function decode() { return result; }',
  'const socket = new Connection();',
  'class Protocol { handshake() {} }',
  'const cipher = encrypt(data);',
  'function validate() { return true; }',
  'const stream = openChannel();',
];

interface HackerBackgroundProps {
  opacity?: number;
  speed?: number;
}

export default function HackerBackground({ opacity = 0.15, speed = 1 }: HackerBackgroundProps) {
  const animatedValues = useRef(
    CODE_LINES.map(() => ({
      translateY: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = animatedValues.map((anim, index) => {
      // Random starting position
      const startY = -100 - Math.random() * 200;
      const endY = height + 100;
      const duration = 15000 + Math.random() * 10000; // 15-25 seconds
      const delay = index * 500; // Stagger animations

      anim.translateY.setValue(startY);
      anim.opacity.setValue(0);

      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: endY,
              duration: duration / speed,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: opacity,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.delay((duration / speed) - 2000),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      );
    });

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [speed, opacity]);

  return (
    <View style={styles.container} pointerEvents="none">
      {CODE_LINES.map((line, index) => {
        const xPosition = (index % 3) * (width / 3) + 20;
        const fontSize = 10 + (index % 3) * 2; // Vary font sizes

        return (
          <Animated.View
            key={index}
            style={[
              styles.codeLine,
              {
                left: xPosition,
                transform: [{ translateY: animatedValues[index].translateY }],
                opacity: animatedValues[index].opacity,
              },
            ]}
          >
            <Text
              style={[
                styles.codeText,
                {
                  fontSize,
                  color: index % 3 === 0 
                    ? theme.neon.cyan 
                    : index % 3 === 1 
                    ? theme.neon.green 
                    : theme.neon.magenta,
                },
              ]}
            >
              {line}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  codeLine: {
    position: 'absolute',
    width: width / 3 - 40,
  },
  codeText: {
    fontFamily: 'monospace',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});
