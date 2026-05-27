import { Conversation, ChatMode } from '../types/index.ts';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${BASE}/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${BASE}/conversations/${id}`);
  if (!res.ok) throw new Error('Conversation not found');
  return res.json();
}

export async function createConversation(
  title: string,
  mode: ChatMode
): Promise<Conversation> {
  const res = await fetch(`${BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, mode }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`${BASE}/conversations/${id}`, { method: 'DELETE' });
}

// ─── Travel API ───────────────────────────────────────────────────────────────

export interface CountryInfo {
  name: string;
  capital: string;
  currency: string;
  languages: string;
  region: string;
  population: number;
}

export interface CityScores {
  fullName: string;
  teleportScore: number;
  categories: Array<{ name: string; score: number }>;
  summary: string;
}

export interface DestinationInfo {
  query: string;
  country?: CountryInfo;
  city?: CityScores;
}

export async function getDestinationInfo(
  query: string
): Promise<DestinationInfo | null> {
  try {
    const res = await fetch(
      `${BASE}/travel/destination?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Streaming Chat ───────────────────────────────────────────────────────────

export function streamMessage(
  conversationId: string,
  message: string,
  mode: ChatMode,
  onChunk: (text: string) => void,
  onDone: (fullText: string) => void,
  onError: (err: Error) => void,
  destination?: string
): () => void {
  let cancelled = false;

  (async () => {
    try {
      const res = await fetch(`${BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message, mode, destination }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Stream failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.replace(/^event:\s*/, '').trim();
          } else if (line.startsWith('data:')) {
            const raw = line.replace(/^data:\s*/, '');
            try {
              const parsed = JSON.parse(raw);
              if (currentEvent === 'error') {
                onError(new Error(parsed.error || 'Stream error from server'));
                return;
              }
              if (parsed.text !== undefined && !cancelled) {
                if (currentEvent === 'done') {
                  onDone(fullText);
                  return;
                }
                fullText += parsed.text;
                onChunk(parsed.text);
              }
            } catch {
              // skip malformed
            }
            currentEvent = '';
          }
        }
      }

      if (!cancelled) onDone(fullText);
    } catch (err) {
      if (!cancelled)
        onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
  };
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
