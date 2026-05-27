import { useNavigate } from 'react-router-dom';
import { TOOLS } from '../types/index.ts';
import { createConversation } from '../services/api.ts';

export default function Home() {
  const navigate = useNavigate();

  const handleToolClick = async (modeId: string) => {
    try {
      const conv = await createConversation('New Chat', modeId as never);
      navigate(`/chat/${conv.id}`);
    } catch {
      navigate('/chat');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">✈️</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Travel AI Portal</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Your personal AI travel companion powered by ChatGPT and real destination data.
            Plan trips, explore destinations, and find the best deals.
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Start Planning →
          </button>
        </div>

        {/* Feature highlight */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 flex items-start gap-4">
          <span className="text-2xl flex-shrink-0">📍</span>
          <div>
            <p className="font-semibold text-blue-900 text-sm">Powered by real destination data</p>
            <p className="text-blue-700 text-sm mt-0.5">
              Trip Planner and Destination Guide modes automatically pull live country facts
              (REST Countries) and city quality scores (Teleport) — no API key needed.
              The AI uses this real data to give grounded, specific recommendations.
            </p>
          </div>
        </div>

        {/* Tool cards */}
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Choose a travel tool</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className="bg-white rounded-2xl p-6 text-left border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl mb-4`}
              >
                {tool.icon}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {tool.label}
                </h3>
                {tool.hasDestination && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    Live data
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
