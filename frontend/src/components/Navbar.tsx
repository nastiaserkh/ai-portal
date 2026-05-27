import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/chat', label: 'Chat' },
    { to: '/tools', label: 'Tools' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
        <span>🤖</span>
        <span>AI Portal</span>
      </Link>
      <ul className="flex gap-6">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                pathname === to ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
