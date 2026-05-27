import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Conversation, ChatMode } from '../types/index.ts';
import {
  getConversations,
  createConversation,
  deleteConversation,
} from '../services/api.ts';

interface Props {
  onSelect?: (id: string) => void;
  refresh?: number;
}

export default function ConversationSidebar({ refresh }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id: activeId } = useParams();

  const load = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refresh]);

  const handleNew = async () => {
    const conv = await createConversation('New Chat', 'general' as ChatMode);
    setConversations((prev) => [conv, ...prev]);
    navigate(`/chat/${conv.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) navigate('/chat');
  };

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={handleNew}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-xs text-gray-400">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-xs text-gray-400">No conversations yet.</p>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => navigate(`/chat/${c.id}`)}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group hover:bg-gray-100 transition-colors ${
                    activeId === c.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <span className="truncate flex-1">
                    <span className="mr-1">
                      {c.mode === 'code' ? '💻' : c.mode === 'summarizer' ? '📝' : c.mode === 'writing' ? '✍️' : '🤖'}
                    </span>
                    {c.title}
                  </span>
                  <span
                    role="button"
                    onClick={(e) => handleDelete(e, c.id)}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs"
                  >
                    ✕
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
