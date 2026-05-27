export type ChatMode = 'general' | 'code' | 'summarizer' | 'writing';

export interface SendMessageBody {
  conversationId: string;
  message: string;
  mode?: ChatMode;
}

export interface CreateConversationBody {
  title?: string;
  mode?: ChatMode;
}

export const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  general:
    'You are a helpful, friendly AI assistant. Answer clearly and concisely.',
  code:
    'You are an expert software engineer. Prefer concise code examples with brief explanations. Use markdown code blocks.',
  summarizer:
    'You are a summarization assistant. When given text, return a clear and concise summary with the key points as bullet points.',
  writing:
    'You are a professional writing assistant. Help improve clarity, grammar, and tone. Preserve the author\'s voice and style.',
};
