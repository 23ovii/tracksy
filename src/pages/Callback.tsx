import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { exchangeSpotifyCode, verifyOAuthState } from '../services/auth.ts';

function Callback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      navigate('/');
      return;
    }

    if (!verifyOAuthState(state)) {
      setErrorMessage('OAuth state mismatch — possible CSRF. Please try signing in again.');
      return;
    }

    async function finalizeAuth() {
      try {
        const tokenData = await exchangeSpotifyCode(code!);
        login(tokenData);
        navigate('/dashboard');
      } catch (error: any) {
        setErrorMessage(error.message);
      }
    }

    finalizeAuth();
  }, []);

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-700 bg-white/5 p-10 text-center text-slate-200 shadow-glow">
      <p className="text-sm uppercase tracking-[0.32em] text-spotify-green">OAuth callback</p>
      <h2 className="mt-6 text-3xl font-semibold text-white">Finishing authentication...</h2>
      <p className="mt-4 text-slate-400">
        {errorMessage || 'This page captures the Spotify authorization code and exchanges it for an access token.'}
      </p>
      {errorMessage && (
        <p className="mt-4 rounded-3xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</p>
      )}
    </section>
  );
}

export default Callback;
