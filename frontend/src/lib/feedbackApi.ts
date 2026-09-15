import { apiFetch, isApiConfigured } from './api';

export type FeedbackRating = 'excited' | 'happy' | 'neutral' | 'sad' | 'very_sad';
export type FeedbackSource = 'session' | 'account';

export type SubmitFeedbackInput = {
  source: FeedbackSource;
  rating: FeedbackRating;
  comment?: string;
  sessionId?: string;
};

export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<{ ok: true; id: string } | null> {
  if (!isApiConfigured) {
    return null;
  }

  return apiFetch('/feedback', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
