export type ChatMode = 'general' | 'code' | 'summarizer' | 'writing';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: ChatMode;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: Message[];
}

export interface Tool {
  id: ChatMode;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const TOOLS: Tool[] = [
  {
    id: 'general',
    label: 'General Assistant',
    description: 'Ask anything — get helpful, clear answers.',
    icon: '🤖',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'code',
    label: 'Code Helper',
    description: 'Debug, explain, or write code with an expert AI.',
    icon: '💻',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'summarizer',
    label: 'Summarizer',
    description: 'Paste any text and get a crisp summary.',
    icon: '📝',
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'writing',
    label: 'Writing Assistant',
    description: 'Improve your writing — grammar, tone, clarity.',
    icon: '✍️',
    color: 'from-orange-500 to-orange-600',
  },
];
