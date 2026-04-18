function PlaylistCard({ playlist, onOpen }) {
  return (
    <article className="card-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-spotify-green/60 hover:shadow-glow">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Playlist</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{playlist.name}</h3>
        </div>
        <div className="rounded-3xl bg-spotify-green/10 px-3 py-1 text-xs font-medium text-spotify-green">
          {playlist.trackCount} tracks
        </div>
      </div>
      <p className="mb-6 text-sm leading-6 text-slate-300">{playlist.description}</p>
      <button
        type="button"
        onClick={() => onOpen(playlist)}
        className="button-secondary w-full"
      >
        Open playlist
      </button>
    </article>
  );
}

export default PlaylistCard;
