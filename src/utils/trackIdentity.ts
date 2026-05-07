import type { Track } from '../types';

export function buildTrackOccurrenceKeys(tracks: Track[]): string[] {
  const counts = new Map<string, number>();

  return tracks.map((track) => {
    const base = track.id || track.uri;
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    return `${base}#${occurrence}`;
  });
}

export function mapTracksByOccurrenceKey(tracks: Track[]): Map<string, Track> {
  const keys = buildTrackOccurrenceKeys(tracks);
  return new Map(keys.map((key, index) => [key, tracks[index]]));
}

export function restoreTracksFromKeys(baseline: Track[], targetKeys: string[]): Track[] | null {
  if (baseline.length !== targetKeys.length) return null;

  if (targetKeys.every((key) => !key.includes('#'))) {
    const queues = new Map<string, Track[]>();
    for (const track of baseline) {
      const key = track.id || track.uri;
      const queue = queues.get(key) ?? [];
      queue.push(track);
      queues.set(key, queue);
    }

    const restored = targetKeys.map((key) => queues.get(key)?.shift());
    return restored.some((track) => !track) ? null : restored as Track[];
  }

  const byOccurrence = mapTracksByOccurrenceKey(baseline);
  const restored = targetKeys.map((key) => byOccurrence.get(key));

  if (restored.some((track) => !track)) return null;
  return restored as Track[];
}
