import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConversationSidebar from '../components/ConversationSidebar.tsx';
import MessageBubble from '../components/MessageBubble.tsx';
import MessageInput from '../components/MessageInput.tsx';
import { Conversation, Message, ChatMode } from '../types/index.ts';
import {
  getConversation,
  createConversation,
  streamMessage,
} from '../services/api.ts';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cancelStream = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!id) return;
    getConversation(id)
      .then((conv) => {
        setConversation(conv);
        setMessages(conv.messages || []);
      })
      .catch(() => navigate('/chat'));
  }, [id, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = async (text: string, mode: ChatMode) => {
    let convId = id;

    // If no conversation open, create one first
    if (!convId) {
      const newConv = await createConversation('New Chat', mode);
      convId = newConv.id;
      navigate(`/chat/${convId}`, { replace: true });
      setConversation(newConv);
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStreamingText('');
    setIsStreaming(true);

    cancelStream.current = streamMessage(
      convId,
      text,
      mode,
      (chunk) => setStreamingText((prev) => prev + chunk),
      (fullText) => {
        const assistantMessage: Message = {
          id: `temp-ai-${Date.now()}`,
          conversationId: convId!,
          role: 'assistant',
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingText('');
        setIsStreaming(false);
        setSidebarRefresh((n) => n + 1);
      },
      (err) => {
        console.error('Stream error:', err);
        setIsStreaming(false);
        setStreamingText('');
      }
    );
  };

  useEffect(() => {
    return () => {
      cancelStream.current?.();
    };
  }, []);

  const activeMode = (conversation?.mode as ChatMode) || 'general';

  return (
    <div className="flex h-full">
      <ConversationSidebar refresh={sidebarRefresh} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {conversation && (
          <div className="px-6 py-3 border-b border-gray-200 bg-white">
            <h2 className="font-semibold text-gray-800 truncate">{conversation.title}</h2>
            <p className="text-xs text-gray-400 capitalize">Mode: {conversation.mode}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-medium text-gray-600">Start a conversation</p>
              <p className="text-sm mt-1">Type a message below to begin.</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Streaming placeholder */}
          {isStreaming && (
            <div className="flex justify-start mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm mr-2 flex-shrink-0 mt-1">
                🤖
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm bg-white border border-gray-200 shadow-sm text-gray-800">
                {streamingText ? (
                  <span className="whitespace-pre-wrap">{streamingText}</span>
                ) : (
                  <span className="text-gray-400 animate-pulse">Thinking...</span>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <MessageInput
          onSend={handleSend}
          disabled={isStreaming}
          initialMode={activeMode}
        />
      </div>
    </div>
  );
}
