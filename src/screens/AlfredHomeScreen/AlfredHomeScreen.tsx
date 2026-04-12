import React, {useEffect, useMemo, useState} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {observer} from 'mobx-react-lite';
import {AlfredSigil} from '../../components/AlfredSigil';
import {FloatingAlfred} from '../../components/FloatingAlfred';
import {alfredStore} from '../../store';
import {AlfredNative, PermissionsManager, VoicePipeline} from '../../services/alfred';

const MODE_COLORS: Record<string, string> = {
  IDLE: '#8f7440',
  LISTENING: '#b08b48',
  THINKING: '#7b5ea8',
  SPEAKING: '#9a7b3e',
};

export const AlfredHomeScreen: React.FC = observer(() => {
  const [booting, setBooting] = useState(true);
  const [voiceState, setVoiceState] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('At your service, sir.');
  const [busy, setBusy] = useState(false);
  const pulse = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!alfredStore.permissionsRequested) {
      PermissionsManager.requestInitialPermissions().finally(() => {
        alfredStore.setPermissionsRequested(true);
      });
    }
  }, []);

  useEffect(() => {
    const sub = AlfredNative.onOverlayListen?.(() => {
      beginListening();
    });
    return () => sub?.remove();
  }, [busy]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1.05, duration: 1800, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.98, duration: 1800, useNativeDriver: true}),
      ]),
    ).start();
  }, [pulse]);

  const beginListening = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setTranscript('');
    setResponse('');
    await VoicePipeline.runVoiceLoop({
      onState: setVoiceState,
      onTranscript: setTranscript,
      onResponse: setResponse,
    });
    setBusy(false);
  };

  if (booting) {
    return (
      <View style={styles.boot}>
        <AlfredSigil size={160} />
        <Text style={styles.title}>ALFRED</Text>
        <Text style={styles.tagline}>At your service, sir.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.mode}>{alfredStore.mode}</Text>
        <TouchableOpacity
          onPress={() =>
            alfredStore.setPresenceMode(
              alfredStore.presenceMode === 'TACTICAL' ? 'NORMAL' : 'TACTICAL',
            )
          }>
          <Text style={styles.toggle}>{alfredStore.presenceMode}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.response}>{response}</Text>

      <Pressable onPress={beginListening} onLongPress={beginListening} style={styles.center}>
        <Animated.View style={{transform: [{scale: pulse}]}}>
          <AlfredSigil glow={MODE_COLORS[voiceState]} />
        </Animated.View>
      </Pressable>

      <Text style={styles.status}>{voiceState}</Text>
      <Text style={styles.transcript}>{transcript}</Text>
      <Text style={styles.wakeWordState}>
        {alfredStore.wakeWordEnabled && alfredStore.porcupineAccessKey ? 'Wake word configured' : 'Wake word unavailable, tap mode active'}
      </Text>

      <View style={styles.chips}>
        {['Dismiss', 'Remind Me', 'More Detail'].map(c => (
          <View key={c} style={styles.chip}>
            <Text style={styles.chipText}>{c}</Text>
          </View>
        ))}
      </View>
      <FloatingAlfred
        lastTranscript={transcript}
        lastResponse={response}
        onStartListening={beginListening}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a12',
    padding: 16,
    justifyContent: 'space-between',
  },
  boot: {
    flex: 1,
    backgroundColor: '#04060b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  title: {color: '#d9c086', fontSize: 30, letterSpacing: 4, fontWeight: '700'},
  tagline: {color: '#9e8a60', fontSize: 14},
  topBar: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 10},
  mode: {color: '#c4a96a', fontSize: 12},
  toggle: {color: '#8e94a5', fontSize: 12},
  response: {textAlign: 'center', color: '#d6d9df', minHeight: 38},
  center: {alignItems: 'center', justifyContent: 'center', flex: 1},
  status: {textAlign: 'center', color: '#9e8a60', letterSpacing: 2, fontSize: 12},
  transcript: {textAlign: 'center', color: '#b0b9c8', marginTop: 8, minHeight: 24},
  wakeWordState: {textAlign: 'center', color: '#8d93a3', marginTop: 6, fontSize: 12},
  chips: {flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20},
  chip: {
    borderColor: '#8f7440',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {color: '#c9b07a', fontSize: 12},
});
