import { sanitizeCachedFilename } from './sanitizeCachedFilename';

describe('sanitizeCachedFilename', () => {
  it('keeps a simple letter filename', () => {
    expect(sanitizeCachedFilename('CGB-Service-Letter-2026-09-10-multi.pdf', 'x')).toBe(
      'CGB-Service-Letter-2026-09-10-multi.pdf',
    );
  });

  it('strips path segments and unsafe characters', () => {
    expect(sanitizeCachedFilename('../../evil name.pdf', 'fallback.pdf')).toBe('evil-name.pdf');
  });

  it('falls back when nothing usable remains', () => {
    expect(sanitizeCachedFilename('///', 'fallback.pdf')).toBe('fallback.pdf');
  });
});
