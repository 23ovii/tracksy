import { useState, useEffect, useCallback } from 'react';

interface SpotifyStatus {
  isDown: boolean;
  message: string;
}

async function fetchStatus(): Promise<SpotifyStatus> {
  const res = await fetch('/api/spotify-status');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useSpotifyStatus() {
  const [isDown, setIsDown] = useState(false);
  const [message, setMessage] = useState('');

  const check = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setIsDown(data.isDown);
      setMessage(data.message);
    } catch {
      // fail silently — assume operational
    }
  }, []);

  useEffect(() => {
    check();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [check]);

  return { isDown, message };
}
