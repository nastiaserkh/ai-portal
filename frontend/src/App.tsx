import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Chat from './pages/Chat.tsx';
import Tools from './pages/Tools.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-full bg-gray-50">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/tools" element={<Tools />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
