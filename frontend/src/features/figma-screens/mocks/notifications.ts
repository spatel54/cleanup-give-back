export type NotificationPreferenceKey =
  | 'sessionReviews'
  | 'approvalStatus'
  | 'photoCheckpoints'
  | 'newEvents'
  | 'shopOrders';

export type NotificationPreference = {
  id: NotificationPreferenceKey;
  title: string;
  description: string;
  enabled: boolean;
};

export type NotificationCategory = {
  id: string;
  title: string;
  preferences: NotificationPreference[];
};

/** Default notification settings — Figma `notifications` (`649:774`). All off (opt-in). */
export const defaultNotificationCategories: NotificationCategory[] = [
  {
    id: 'tracking-impact',
    title: 'TRACKING & IMPACT',
    preferences: [
      {
        id: 'sessionReviews',
        title: 'Session Reviews',
        description: 'Get a summary when you finish a clean-up walk.',
        enabled: false,
      },
      {
        id: 'approvalStatus',
        title: 'Approval Status',
        description: 'Crucial updates on pending verifications and rejected sessions.',
        enabled: false,
      },
      {
        id: 'photoCheckpoints',
        title: 'Photo Checkpoints',
        description: 'Reminders to take before/after photos during long sessions.',
        enabled: false,
      },
    ],
  },
  {
    id: 'community-store',
    title: 'COMMUNITY & STORE',
    preferences: [
      {
        id: 'newEvents',
        title: 'New Events',
        description: 'Alerts for upcoming community clean-ups in your area.',
        enabled: false,
      },
      {
        id: 'shopOrders',
        title: 'Shop & Orders',
        description: 'Updates on shipments and product availability.',
        enabled: false,
      },
    ],
  },
];
