import { useState, useRef, KeyboardEvent } from 'react';
import { ChatMode, TOOLS } from '../types/index.ts';

interface Props {
  onSend: (message: string, mode: ChatMode, destination?: string) => void;
  disabled?: boolean;
  initialMode?: ChatMode;
}

export default function MessageInput({
  onSend,
  disabled,
  initialMode = 'travel',
}: Props) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [destination, setDestination] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeTool = TOOLS.find((t) => t.id === mode);
  const showDestination = activeTool?.hasDestination ?? false;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, mode, showDestination ? destination.trim() || undefined : undefined);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Mode:</span>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setMode(tool.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mode === tool.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>

      {/* Destination field — only for trip_planner and destination modes */}
      {showDestination && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500 font-medium flex-shrink-0">📍 Destination:</span>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Paris, Tokyo, New York…"
            disabled={disabled}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {destination && (
            <span className="text-xs text-emerald-600 font-medium">
              ✓ Live country &amp; city data will be fetched
            </span>
          )}
        </div>
      )}

      {/* Message input */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={
            disabled
              ? 'AI is typing...'
              : mode === 'trip_planner'
              ? 'How many days? Any preferences? (Enter to send)'
              : mode === 'destination'
              ? 'What would you like to know about this destination?'
              : mode === 'booking'
              ? 'Tell me your travel dates, budget, and where you\'re going…'
              : 'Ask me anything about travel… (Enter to send)'
          }
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 max-h-40 overflow-y-auto"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {disabled ? '...' : '↑'}
        </button>
      </div>
    </div>
  );
}
