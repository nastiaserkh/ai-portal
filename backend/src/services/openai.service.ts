/**
 * LLM service — Google Gemini via OpenAI-compatible endpoint
 *
 * Gemini exposes an OpenAI-compatible API at:
 *   https://generativelanguage.googleapis.com/v1beta/openai/
 *
 * This means we can use the standard `openai` npm package unchanged —
 * just swap in the Gemini base URL and API key.
 *
 * Free-tier model: gemini-2.5-flash (no credit card needed)
 * Get your API key: https://aistudio.google.com/app/apikey
 * Docs: https://ai.google.dev/gemini-api/docs/openai
 */

import OpenAI from 'openai';
import { ChatMode, SYSTEM_PROMPTS } from '../types/index.js';

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(mode: ChatMode, extraContext?: string): string {
  return extraContext
    ? `${SYSTEM_PROMPTS[mode]}\n\n${extraContext}`
    : SYSTEM_PROMPTS[mode];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function streamChatCompletion(
  messages: ChatMessage[],
  mode: ChatMode,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => Promise<void>,
  extraContext?: string
): Promise<void> {
  const systemPrompt = buildSystemPrompt(mode, extraContext);

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullText += delta;
      onChunk(delta);
    }
  }

  await onDone(fullText);
}

export async function getChatCompletion(
  messages: ChatMessage[],
  mode: ChatMode,
  extraContext?: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(mode, extraContext);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });

  return response.choices[0]?.message?.content || '';
}
