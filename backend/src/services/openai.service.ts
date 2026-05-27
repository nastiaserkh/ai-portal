import OpenAI from 'openai';
import { ChatMode, SYSTEM_PROMPTS } from '../types/index.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  mode: ChatMode
): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS[mode];

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content || '';
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  mode: ChatMode,
  onChunk: (chunk: string) => void,
  onDone: (fullText: string) => Promise<void>
): Promise<void> {
  const systemPrompt = SYSTEM_PROMPTS[mode];

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
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
