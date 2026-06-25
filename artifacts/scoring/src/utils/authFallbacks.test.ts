import { describe, expect, it } from 'vitest';
import { isEdgeFunctionUnavailable, phoneSyntheticEmail } from './authEdgeUtils';

describe('authEdgeUtils', () => {
  it('detects InvalidWorkerCreation as edge unavailable', () => {
    const res = new Response('', { status: 500 });
    expect(
      isEdgeFunctionUnavailable(res, {
        msg: 'InvalidWorkerCreation: worker boot error: failed to bootstrap runtime: could not find an appropriate entrypoint',
      }),
    ).toBe(true);
  });

  it('builds synthetic phone email', () => {
    expect(phoneSyntheticEmail('9876543210')).toBe('9876543210@vscor.phone');
    expect(phoneSyntheticEmail('+91 98765 43210')).toBe('919876543210@vscor.phone');
  });
});
