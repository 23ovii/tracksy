import { describe, expect, it } from 'vitest';

import { errorMessage, isAbortError } from './errors';

describe('isAbortError', () => {
  it('recognizes DOM abort errors', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
  });

  it('rejects other errors and non-errors', () => {
    expect(isAbortError(new Error('Failure'))).toBe(false);
    expect(isAbortError({ name: 'AbortError' })).toBe(false);
  });
});

describe('errorMessage', () => {
  it('returns an Error message', () => {
    expect(errorMessage(new Error('Failure'))).toBe('Failure');
  });

  it('returns a thrown string', () => {
    expect(errorMessage('Failure')).toBe('Failure');
  });

  it('uses a fallback for other values', () => {
    expect(errorMessage({ reason: 'Failure' })).toBe('Something went wrong');
    expect(errorMessage(null, 'Save failed')).toBe('Save failed');
  });
});
