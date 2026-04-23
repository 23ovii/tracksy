import { formatDuration } from '../utils/format.js';

function TrackItem({ track }) {
  return (
    <div className="grid gap-3 rounded-3xl border border-slate-700 bg-white/5 p-4 text-sm text-slate-200 sm:grid-cols-[1fr_96px]">
      <div>
        <p className="font-medium text-white">{track.name}</p>
        <p className="mt-1 text-xs text-slate-400">{track.artist}</p>
      </div>
      <div className="flex items-center justify-end text-slate-400">{formatDuration(track.durationMs)}</div>
    </div>
  );
}

export default TrackItem;
