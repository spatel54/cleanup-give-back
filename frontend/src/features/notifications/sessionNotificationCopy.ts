const SKIP_PLACE_KEYS = new Set(['unknown', '—', '-', '']);

/** First comma segment of a session place, or null when empty. */
export function shortSessionPlaceName(location: string | null | undefined): string | null {
  const trimmed = location?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  const first = trimmed.split(',')[0]?.trim() ?? '';
  if (!first || SKIP_PLACE_KEYS.has(first.toLowerCase())) {
    return null;
  }
  return first;
}

export function sessionPlaceFromFields(
  description: string | null | undefined,
  activity: string | null | undefined,
): string | null {
  return shortSessionPlaceName(description) ?? shortSessionPlaceName(activity);
}

export function formatSessionUpdateTitle(baseTitle: string, place: string | null): string {
  if (!place || baseTitle.includes(place)) {
    return baseTitle;
  }
  return `${baseTitle} · ${place}`;
}

export function formatSessionUpdateBody(baseBody: string, place: string | null): string {
  if (!place) {
    return baseBody;
  }
  if (baseBody.toLowerCase().includes(place.toLowerCase())) {
    return baseBody;
  }
  if (/\bsession hours\b/i.test(baseBody)) {
    return baseBody.replace(/\bsession hours\b/i, (match) => `${match} at ${place}`);
  }
  if (/\bvolunteer session\b/i.test(baseBody)) {
    return baseBody.replace(/\bvolunteer session\b/i, (match) => `${match} at ${place}`);
  }
  if (/\bsession\b/i.test(baseBody)) {
    return baseBody.replace(/\bsession\b/i, (match) => `${match} at ${place}`);
  }
  return `${place}. ${baseBody}`;
}
