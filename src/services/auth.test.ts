import { beforeEach, describe, expect, it } from 'vitest';

import { verifyOAuthState } from './auth';

const STATE_KEY = 'tracksy_oauth_state';

beforeEach(() => {
  sessionStorage.clear();
});

describe('verifyOAuthState', () => {
  it('returns true and clears the state when it matches', () => {
    sessionStorage.setItem(STATE_KEY, 'expected-state');

    expect(verifyOAuthState('expected-state')).toBe(true);
    expect(sessionStorage.getItem(STATE_KEY)).toBeNull();
  });

  it('returns false and clears the state when it does not match', () => {
    sessionStorage.setItem(STATE_KEY, 'expected-state');

    expect(verifyOAuthState('different-state')).toBe(false);
    expect(sessionStorage.getItem(STATE_KEY)).toBeNull();
  });

  it('returns false when there is no stored state', () => {
    expect(verifyOAuthState('returned-state')).toBe(false);
  });
});
