import { createDataClient } from '@/lib/supabase/server';
import { SampleDataBanner } from '@/components/ui/SampleDataBanner';
import { FeedbackRow } from './FeedbackRow';
import type { VolunteerFeedback } from '@/types/database';

const EMOJI_MAP: Record<string, { emoji: string; label: string; score: number; color: string }> = {
  excited: { emoji: '🤩', label: 'Excited', score: 5, color: '#007536' },
  happy: { emoji: '😊', label: 'Happy', score: 4, color: '#4a9e6e' },
  neutral: { emoji: '😐', label: 'Neutral', score: 3, color: '#835400' },
  sad: { emoji: '😔', label: 'Sad', score: 2, color: '#cc7700' },
  very_sad: { emoji: '😢', label: 'Very Sad', score: 1, color: '#ba1a1a' },
};

const MOCK_FEEDBACK = [
  { id: 'f1', volunteer: 'Jordan Kim', rating: 'excited', comment: 'Loved every minute — the team coordination was excellent and the park looks so much better!', submittedAt: '2026-07-20T14:23:00Z', activity: 'Park Cleanup' },
  { id: 'f2', volunteer: 'Devon Okafor', rating: 'happy', comment: 'Great experience. The route was well-planned and volunteers were friendly.', submittedAt: '2026-07-20T11:05:00Z', activity: 'Beach Cleanup' },
  { id: 'f3', volunteer: 'Sophia Chen', rating: 'excited', comment: null, submittedAt: '2026-07-19T16:40:00Z', activity: 'Trail Cleanup' },
  { id: 'f4', volunteer: 'Marcus Rivera', rating: 'neutral', comment: 'It was okay. Wish we had more supplies at the start.', submittedAt: '2026-07-19T09:15:00Z', activity: 'Neighborhood Cleanup' },
  { id: 'f5', volunteer: 'Luna Martinez', rating: 'happy', comment: 'Really fulfilling! Will definitely come back.', submittedAt: '2026-07-18T13:30:00Z', activity: 'River Cleanup' },
  { id: 'f6', volunteer: 'Miguel Santos', rating: 'excited', comment: 'Best session yet. We cleared an entire trail section in under 3 hours.', submittedAt: '2026-07-18T10:00:00Z', activity: 'Trail Cleanup' },
  { id: 'f7', volunteer: 'Fatima Hassan', rating: 'happy', comment: null, submittedAt: '2026-07-17T15:20:00Z', activity: 'Park Cleanup' },
  { id: 'f8', volunteer: 'Destiny Thompson', rating: 'neutral', comment: 'Session was fine. The location was hard to get to without a car.', submittedAt: '2026-07-17T08:50:00Z', activity: 'Highway Litter Pick' },
  { id: 'f9', volunteer: 'Priya Nair', rating: 'sad', comment: 'I got there and nobody else showed up for 45 minutes.', submittedAt: '2026-07-16T12:10:00Z', activity: 'Beach Cleanup', flagged: true },
  { id: 'f10', volunteer: 'Tyler Washington', rating: 'happy', comment: 'Good vibes, easy to follow instructions.', submittedAt: '2026-07-15T14:05:00Z', activity: 'Neighborhood Cleanup' },
  { id: 'f11', volunteer: 'Isaiah Grant', rating: 'excited', comment: 'First time volunteering and it was amazing!', submittedAt: '2026-07-14T09:30:00Z', activity: 'Park Cleanup' },
  { id: 'f12', volunteer: 'Aaliyah Brooks', rating: 'very_sad', comment: 'Session was cancelled last minute with no notice. Very frustrating.', submittedAt: '2026-07-13T16:00:00Z', activity: 'River Cleanup', flagged: true },
];

type FeedbackWithVolunteer = VolunteerFeedback & {
  volunteer_name?: string;
  volunteer_email?: string;
  activity?: string;
};

export default async function FeedbackPage() {
  const supabase = await createDataClient();
  
  // Fetch feedback from database
  const { data: feedbackData } = await supabase
    .from('volunteer_feedback')
    .select('*')
    .order('submitted_at', { ascending: false });

  // Enrich with user directory and session data
  const enrichedFeedback: FeedbackWithVolunteer[] = [];
  
  if (feedbackData && feedbackData.length > 0) {
    const userIds = [...new Set(feedbackData.map(f => f.user_id).filter(Boolean))];
    const sessionIds = [...new Set(feedbackData.map(f => f.session_id).filter(Boolean))];
    
    // Fetch user directory names and emails
    const { data: users } = await supabase.auth.admin.listUsers();
    const userMap = new Map(
      users?.users.map(u => [
        u.id,
        {
          name: u.user_metadata?.full_name || 'Unknown',
          email: u.email,
        },
      ]) ?? []
    );
    
    // Fetch session activities
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, activity')
      .in('id', sessionIds);
    
    const sessionMap = new Map(sessions?.map(s => [s.id, s.activity]) ?? []);
    
    for (const fb of feedbackData) {
      const userInfo = fb.user_id ? userMap.get(fb.user_id) : undefined;
      const activity = fb.session_id ? sessionMap.get(fb.session_id) : undefined;
      
      enrichedFeedback.push({
        ...fb,
        volunteer_name: userInfo?.name,
        volunteer_email: userInfo?.email,
        activity,
      });
    }
  }

  const feedback = enrichedFeedback.length > 0 ? enrichedFeedback : MOCK_FEEDBACK.map(m => ({
    id: m.id,
    user_id: null,
    session_id: null,
    source: 'session' as const,
    rating: m.rating as VolunteerFeedback['rating'],
    comment: m.comment,
    flagged: (m as typeof m & { flagged?: boolean }).flagged ?? false,
    submitted_at: m.submittedAt,
    volunteer_name: m.volunteer,
    activity: m.activity,
  }));
  
  const useMock = enrichedFeedback.length === 0;

  const avg = feedback.reduce((sum, f) => sum + (EMOJI_MAP[f.rating ?? 'neutral']?.score ?? 0), 0) / feedback.length;

  const distribution = Object.entries(EMOJI_MAP).map(([key, val]) => ({
    ...val,
    key,
    count: feedback.filter((f) => f.rating === key).length,
  }));

  const flagged = feedback.filter((f) => f.flagged).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Feedback</h1>
      </div>
      
      {useMock && <SampleDataBanner />}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Avg Rating</p>
          <p className="font-data text-[28px] font-semibold text-primary">{avg.toFixed(1)}<span className="text-[16px] text-text-tertiary font-normal">/5</span></p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Total</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">{feedback.length}</p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Flagged</p>
          <p className={`font-data text-[28px] font-semibold ${flagged > 0 ? 'text-[#ba1a1a]' : 'text-text-primary'}`}>{flagged}</p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">With Comment</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">{feedback.filter((f) => f.comment).length}</p>
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-bg-surface border border-border-outline rounded-md p-lg mb-xl">
        <p className="font-data text-[12px] tracking-[0.96px] uppercase text-text-tertiary mb-md">Rating Distribution</p>
        <div className="flex gap-xl">
          {distribution.map((d) => (
            <div key={d.key} className="flex flex-col items-center gap-xs">
              <span className="text-2xl">{d.emoji}</span>
              <span className="font-data text-[18px] font-semibold text-text-primary">{d.count}</span>
              <span className="font-data text-[10px] text-text-tertiary">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback list */}
      <div className="flex flex-col gap-sm">
        {feedback.map((fb) => (
          <FeedbackRow key={fb.id} feedback={fb} emojiMap={EMOJI_MAP} />
        ))}
      </div>
    </div>
  );
}
