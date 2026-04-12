import {alfredStore} from '../../store';
import {soundEngine} from './SoundEngine';
import {AlfredNative} from './AlfredNative';
import {runLocalAssistantQuery} from './AlfredAssistant';
import {MemoryStore} from './MemoryStore';

export type VoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export const VoicePipeline = {
  async runVoiceLoop(handlers: {
    onState?: (state: VoiceState) => void;
    onTranscript?: (transcript: string) => void;
    onResponse?: (response: string) => void;
  }) {
    const {onState, onTranscript, onResponse} = handlers;

    await MemoryStore.logTimeline('HEARD', 'voice_tap');
    onState?.('LISTENING');
    soundEngine.play('listeningStart');

    let transcript = '';
    try {
      transcript = await AlfredNative.startListening();
    } catch {
      transcript = '';
    }

    if (!transcript) {
      onState?.('IDLE');
      return;
    }

    onTranscript?.(transcript);
    AlfredNative.updateOverlay(transcript, undefined);
    await MemoryStore.logTimeline('PARSED', transcript);
    onState?.('THINKING');

    const response = await runLocalAssistantQuery(transcript);
    onResponse?.(response);
    AlfredNative.updateOverlay(undefined, response);

    onState?.('SPEAKING');
    soundEngine.setSpeaking(true);
    await AlfredNative.speak(response, alfredStore.ttsEnabled);
    await MemoryStore.logTimeline('SPOKE', response);
    soundEngine.setSpeaking(false);

    onState?.('IDLE');
  },
};
