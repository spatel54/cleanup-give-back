export type AccountProfile = {
  initials: string;
  displayName: string;
  email: string;
  totalHoursLabel: string;
  approvedHoursLabel: string;
  sessionsLabel: string;
};

/** Mock profile for Account tab (Figma `account`, node `569:896`). */
export const defaultAccountProfile: AccountProfile = {
  initials: 'JD',
  displayName: 'Jane Doe',
  email: 'jane.doe@example.com',
  totalHoursLabel: '0.0',
  approvedHoursLabel: '0.0',
  sessionsLabel: '0',
};
