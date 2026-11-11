import { describe, it, expect } from 'vitest';
import { formatBytes, initials, timeAgo } from './format';
import { resourceTypeLabel, RESOURCE_TYPES } from './constants';

describe('format helpers', () => {
  it('formats byte sizes into human-readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });

  it('builds up to two-letter initials from a name', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('Grace')).toBe('G');
    expect(initials('  ')).toBe('');
    expect(initials('')).toBe('');
  });

  it('describes very recent timestamps as "just now"', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
    expect(timeAgo('')).toBe('');
  });
});

describe('resource type constants', () => {
  it('maps type values to human labels', () => {
    expect(resourceTypeLabel('pyq')).toBe('PYQ');
    expect(resourceTypeLabel('lab_manual')).toBe('Lab Manual');
  });

  it('returns the raw value for unknown types', () => {
    expect(resourceTypeLabel('mystery')).toBe('mystery');
  });

  it('exposes a route for every resource type', () => {
    RESOURCE_TYPES.forEach((t) => {
      expect(typeof t.route).toBe('string');
      expect(t.route.startsWith('/resources')).toBe(true);
    });
  });
});
