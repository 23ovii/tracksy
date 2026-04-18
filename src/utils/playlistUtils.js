export function removeDuplicateTracks(tracks) {
  const seen = new Set();
  return tracks.filter((track) => {
    const key = track.id || `${track.name}-${track.artist}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function sortTracksByVibe(tracks) {
  return [...tracks].sort((a, b) => {
    const score = (track) => {
      const durationScore = Math.min(track.durationMs / 300000, 1);
      const keywordScore = (track.name + ' ' + track.artist).split(/\s+/).length / 10;
      return durationScore * 0.6 + Math.min(keywordScore, 1) * 0.4;
    };

    return score(b) - score(a);
  });
}

export function enhancePlaylistSuggestions(tracks) {
  const topArtists = Array.from(
    new Set(tracks.slice(0, 5).map((track) => track.artist))
  );

  return {
    seedArtists: topArtists,
    message: `Use ${topArtists.join(', ')} as recommendation seeds for future playlist enhancement.`,
  };
}
