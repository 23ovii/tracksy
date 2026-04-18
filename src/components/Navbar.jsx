import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

function Navbar() {
  const { logout, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b border-slate-800 bg-black/10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-spotify-green text-slate-950 shadow-glow">
            T
          </span>
          Tracksy
        </Link>
        <nav className="flex items-center gap-3 text-sm text-slate-300">
          <Link
            to="/"
            className={`rounded-full px-4 py-2 transition ${location.pathname === '/' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className={`rounded-full px-4 py-2 transition ${location.pathname === '/dashboard' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
          >
            Dashboard
          </Link>
          {isAuthenticated && (
            <button
              onClick={logout}
              className="rounded-full border border-slate-700 bg-white/5 px-4 py-2 text-slate-200 transition hover:border-spotify-green hover:text-white"
            >
              Sign Out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
