export type ChatMode = 'travel' | 'trip_planner' | 'destination' | 'booking';

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
  /** Whether this mode shows a destination input field */
  hasDestination: boolean;
}

export const TOOLS: Tool[] = [
  {
    id: 'travel',
    label: 'Travel Advisor',
    description: 'Ask anything about travel — destinations, tips, culture, safety, and more.',
    icon: '✈️',
    color: 'from-sky-500 to-blue-600',
    hasDestination: false,
  },
  {
    id: 'trip_planner',
    label: 'Trip Planner',
    description: 'Get a detailed day-by-day itinerary powered by real attraction data.',
    icon: '🗺️',
    color: 'from-emerald-500 to-teal-600',
    hasDestination: true,
  },
  {
    id: 'destination',
    label: 'Destination Guide',
    description: 'Explore any city or country — history, culture, food, and hidden gems.',
    icon: '📍',
    color: 'from-orange-500 to-rose-500',
    hasDestination: true,
  },
  {
    id: 'booking',
    label: 'Booking Advisor',
    description: 'Find the best flights, hotels, and deals for your next adventure.',
    icon: '🏨',
    color: 'from-violet-500 to-purple-600',
    hasDestination: false,
  },
];
