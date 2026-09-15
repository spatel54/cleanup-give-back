import { redirect } from 'next/navigation';

/** Volunteers + Court Hours merged into a single Users tab — see /users. */
export default function CourtHoursPage() {
  redirect('/users?filter=court');
}
