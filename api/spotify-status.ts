import { get } from '@vercel/edge-config';

export const config = { runtime: 'edge' };

export default async function handler() {
  try {
    const [isDown, message] = await Promise.all([
      get<boolean>('spotify_down'),
      get<string>('message'),
    ]);
    return Response.json(
      { isDown: isDown ?? false, message: message ?? '' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ isDown: false, message: '' });
  }
}
