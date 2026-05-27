import { useState, useRef, KeyboardEvent } from 'react';
import { ChatMode, TOOLS } from '../types/index.ts';

interface Props {
  onSend: (message: string, mode: ChatMode) => void;
  disabled?: boolean;
  initialMode?: ChatMode;
}

export default function MessageInput({ onSend, disabled, initialMode = 'general' }: Props) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, mode);
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
      <div className="flex items-center gap-2 mb-2">
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

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={disabled ? 'AI is typing...' : 'Type a message... (Enter to send, Shift+Enter for new line)'}
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
