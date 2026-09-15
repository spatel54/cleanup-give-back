export function sanitizeCachedFilename(filename: string, fallback: string): string {
  const base = filename.split(/[/\\]/).pop()?.trim() ?? '';
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}
