import AsyncStorage from '@react-native-async-storage/async-storage';
import {modelStore} from '../../store';
import {toApiCompletionParams} from '../../utils/completionTypes';
import {AlfredNative} from './AlfredNative';
import {ConnectorService} from './ConnectorService';
import {MemoryStore} from './MemoryStore';
import {alfredStore} from '../../store';

const SYSTEM_PROMPT = `You are Alfred, a private personal assistant running on this device.
You are calm, competent, discreet, and efficient.
Keep spoken responses concise and useful.
Prefer under 3 sentences unless asked for detail.
Never say 'as an AI' unless directly asked.
Use 'sir' occasionally, not constantly.
When an action is completed, brief confirmations are enough: 'Handled.' 'Done.' 'Taken care of.'
When information is missing, say: 'I'm afraid I don't have that information, sir.'`;

const KEY = 'alfred_voice_history';

type Turn = {role: 'user' | 'assistant'; content: string};

async function getTurns(): Promise<Turn[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveTurns(turns: Turn[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(turns.slice(-20)));
}

export async function runLocalAssistantQuery(query: string): Promise<string> {
  const q = query.trim();
  if (!q) return 'Standing by.';

  await MemoryStore.logTimeline('HEARD', q);

  const task = MemoryStore.extractTaskIntent(q);
  if (task) {
    await MemoryStore.addTask(task);
    await MemoryStore.logTimeline('ACTION', `task:${task}`);
    return `Done. I've added '${task}' to your tasks.`;
  }

  const remote = await ConnectorService.maybeHandleRemotely(q, {mode: 'assistant'});
  if (remote) return remote;

  // Connector shortcuts first (local, permission-aware)
  if (/\b(today|calendar|events)\b/i.test(q)) {
    const events = await AlfredNative.getCalendarEvents(1);
    if (!events.length) return 'No events on your calendar today.';
    return `You have ${events.length} event${events.length > 1 ? 's' : ''} today. First: ${events[0].title}.`;
  }
  if (/\bnotifications?\b/i.test(q)) {
    const notifications = await AlfredNative.getCapturedNotifications();
    if (!notifications.length) return 'No notification summary available.';
    const latest = notifications.slice(-3).map((n: any) => `${n.title || n.packageName}`).join(', ');
    return `Recent notifications: ${latest}.`;
  }

  const engine = modelStore.engine;
  if (!engine) return "I'm afraid the local model isn't loaded yet, sir.";

  const history = await getTurns();
  const dbHistory = await MemoryStore.getRecentConversations(6);
  const context = history.slice(-10);
  const memoryContext = dbHistory.map(h => ({role: "assistant" as const, content: `Memory: ${h.transcript} => ${h.response}`}));
  const messages = [
    {role: 'system', content: SYSTEM_PROMPT},
    ...context,
    ...memoryContext,
    {role: 'user', content: q},
  ];

  const params = toApiCompletionParams({
    messages,
    n_predict: 196,
    temperature: 0.5,
    top_p: 0.9,
  } as any);

  await MemoryStore.logTimeline('CONTEXT', `messages:${messages.length}`);
  const result = await engine.completion(params);
  await MemoryStore.logTimeline('GENERATED', 'completion');
  const response = (result.content || result.text || '').trim() || "I'm afraid I don't have that information, sir.";

  await saveTurns([...history, {role: 'user', content: q}, {role: 'assistant', content: response}]);
  await MemoryStore.saveConversationTurn({
    transcript: q,
    response,
    mode: alfredStore.mode,
  });
  return response;
}
