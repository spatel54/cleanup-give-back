/** Service types a user can be logging clean-up hours for (account details step + Personal Details editor). */
export const SERVICE_TYPES = ['Court Ordered', 'Volunteering', 'School', 'Other'] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
