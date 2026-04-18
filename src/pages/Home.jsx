import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Button from '../components/Button.jsx';
import { buildSpotifyAuthUrl } from '../services/auth.js';

function Home() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const authUrl = await buildSpotifyAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error(error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl py-12">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-spotify-green/30 bg-white/5 px-4 py-2 text-sm text-spotify-green">
            Spotify playlist preview • real OAuth-ready flow
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Tracksy brings your playlists into a modern Spotify-inspired dashboard.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
            Login with Spotify, browse your playlists, inspect tracks, and prepare for future automation features like cleaning duplicates, sorting by vibe, and enhancing recommendations.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button onClick={handleLogin} disabled={isLoading}>
              {isLoading ? 'Connecting…' : 'Login with Spotify'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="card-surface p-6 shadow-glow">
          <h2 className="text-lg font-semibold text-white">Ready for future features</h2>
          <ul className="mt-6 space-y-4 text-slate-300">
            <li className="rounded-3xl bg-white/5 p-4">Clean duplicates with a single click</li>
            <li className="rounded-3xl bg-white/5 p-4">Sort playlists by mood and energy</li>
            <li className="rounded-3xl bg-white/5 p-4">Enhance recommendations from your most-played tracks</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Home;
