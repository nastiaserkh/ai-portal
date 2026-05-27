import { useNavigate } from 'react-router-dom';
import { TOOLS } from '../types/index.ts';
import { createConversation } from '../services/api.ts';

export default function Tools() {
  const navigate = useNavigate();

  const handleTool = async (modeId: string) => {
    const conv = await createConversation('New Chat', modeId as never);
    navigate(`/chat/${conv.id}`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Tools</h1>
        <p className="text-gray-500 text-sm mb-8">
          Pick a tool to start a new conversation with a specialized AI mode.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleTool(tool.id)}
              className="bg-white rounded-2xl p-6 text-left border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-3xl mb-4 shadow-md`}
              >
                {tool.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {tool.label}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
              <div className="mt-4 text-xs font-medium text-blue-600 group-hover:underline">
                Open Tool →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
