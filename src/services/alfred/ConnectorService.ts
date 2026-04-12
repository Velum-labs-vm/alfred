import axios from 'axios';
import {alfredStore} from '../../store';
import {PrivacyGuard} from './PrivacyGuard';

export type ConnectorSettings = {
  manorUrl?: string;
  relayUrl?: string;
  apiKey?: string;
};

let settings: ConnectorSettings = {};

export const ConnectorService = {
  configure(next: ConnectorSettings) {
    settings = {...settings, ...next};
  },

  async testConnection() {
    const endpoint =
      alfredStore.mode === 'MANOR NETWORK' ? settings.manorUrl : settings.relayUrl;
    if (!endpoint) {
      return {ok: false, reason: 'No endpoint configured'};
    }
    try {
      await axios.get(endpoint, {timeout: 4000});
      return {ok: true};
    } catch {
      return {ok: false, reason: 'Unavailable'};
    }
  },

  async maybeHandleRemotely(query: string, context: Record<string, unknown>) {
    if (alfredStore.mode === 'LOCAL ONLY') return null;

    const endpoint =
      alfredStore.mode === 'MANOR NETWORK' ? settings.manorUrl : settings.relayUrl;
    if (!endpoint) {
      return null;
    }

    const safeContext = PrivacyGuard.sanitizeContext(context);
    const payload = {query, context: safeContext};

    try {
      const res = await axios.post(endpoint, payload, {
        timeout: 6000,
        headers: settings.apiKey ? {Authorization: `Bearer ${settings.apiKey}`} : undefined,
      });

      const text = typeof res.data?.response === 'string' ? res.data.response : null;

      await PrivacyGuard.logExternalRequest({
        timestamp: new Date().toISOString(),
        endpoint,
        query_length: query.length,
        context_fields_sent: Object.keys(safeContext),
        response_length: text?.length ?? 0,
      });

      return text;
    } catch {
      return null;
    }
  },
};
