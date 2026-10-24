import { describe, expect, it } from 'vitest';

import { playlistKeys } from './playlists';

describe('playlistKeys', () => {
  it('isolates playlist list and track caches by account', () => {
    expect(playlistKeys.lists('account-a')).not.toEqual(playlistKeys.lists('account-b'));
    expect(playlistKeys.tracks('account-a', 'playlist-1')).not.toEqual(
      playlistKeys.tracks('account-b', 'playlist-1'),
    );
  });
});
