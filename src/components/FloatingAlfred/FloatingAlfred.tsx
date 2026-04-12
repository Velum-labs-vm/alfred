import React, {useMemo, useRef, useState} from 'react';
import {Animated, PanResponder, Pressable, StyleSheet, Text, View} from 'react-native';

type Props = {
  lastTranscript: string;
  lastResponse: string;
  onStartListening: () => void;
};

export const FloatingAlfred: React.FC<Props> = ({lastTranscript, lastResponse, onStartListening}) => {
  const [expanded, setExpanded] = useState(false);
  const pos = useRef(new Animated.ValueXY({x: 20, y: 440})).current;
  const lastTap = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, {dx: pos.x, dy: pos.y}], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pos.extractOffset();
        },
      }),
    [pos],
  );

  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      onStartListening();
    } else {
      setExpanded(v => !v);
    }
    lastTap.current = now;
  };

  return (
    <Animated.View style={[styles.wrap, {transform: pos.getTranslateTransform()}]} {...panResponder.panHandlers}>
      <Pressable onPress={onTap} style={styles.bubble}>
        <Text style={styles.sigil}>🜂</Text>
      </Pressable>
      {expanded && (
        <View style={styles.panel}>
          <Text style={styles.label}>Last transcript</Text>
          <Text style={styles.text}>{lastTranscript || '—'}</Text>
          <Text style={styles.label}>Last response</Text>
          <Text style={styles.text}>{lastResponse || '—'}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {position: 'absolute', zIndex: 99},
  bubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#8f7440',
    backgroundColor: '#0b111c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigil: {color: '#c5aa6b', fontSize: 18},
  panel: {
    marginTop: 8,
    width: 230,
    backgroundColor: '#0b1018',
    borderColor: '#8f7440',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  label: {color: '#8b93a4', fontSize: 11, marginBottom: 4},
  text: {color: '#d7dde8', fontSize: 12, marginBottom: 8},
});
