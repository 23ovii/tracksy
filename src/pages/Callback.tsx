import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { exchangeSpotifyCode, verifyOAuthState } from '../services/auth.ts';
import { trackEvent, TrackEvents } from '../services/analytics';

function classifyOAuthError(error: unknown): string {
  const message = String((error as { message?: string })?.message ?? '').toLowerCase();

  if (message.includes('invalid_grant') || message.includes('grant')) {
    return 'SPOTIFY_INVALID_GRANT';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'SPOTIFY_NETWORK';
  }
  if (message.includes('timeout')) {
    return 'SPOTIFY_TIMEOUT';
  }
  if (message.includes('invalid_client')) {
    return 'SPOTIFY_INVALID_CLIENT';
  }

  return 'UNKNOWN_OAUTH_ERROR';
}

function Callback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

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
        trackEvent(TrackEvents.OAUTH_COMPLETE);
        navigate('/dashboard');
      } catch (error: unknown) {
        trackEvent(TrackEvents.OAUTH_ERROR, { reason: classifyOAuthError(error) });
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
      }
    }

    finalizeAuth();
  }, [login, navigate]);

  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'center', padding: 24 }}>
      <section style={{
        width: '100%', maxWidth: 768, borderRadius: 24,
        border: '1px solid var(--border2)',
        background: 'var(--surface)',
        padding: 40, textAlign: 'center',
        boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.32em', color: 'var(--green)' }}>
          OAuth callback
        </p>
        <h2 style={{ marginTop: 24, fontSize: 28, fontWeight: 600, color: 'var(--text)' }}>
          Finishing authentication...
        </h2>
        <p style={{ marginTop: 16, color: 'var(--text-2)' }}>
          This page captures the Spotify authorization code and exchanges it for an access token.
        </p>
        {errorMessage && (
          <p style={{
            marginTop: 16, borderRadius: 24,
            background: 'rgba(244,63,94,0.10)',
            padding: '12px 16px', fontSize: 14,
            color: 'var(--error-text)',
          }}>
            {errorMessage}
          </p>
        )}
      </section>
    </div>
  );
}

export default Callback;
