import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { ProfilePage } from '@/components/pages/ProfilePage';
import {
  ADMIN_PROFILE,
  defaultAdminDisplayName,
  defaultAdminEmail,
  resolveAdminDisplayName,
} from '@/lib/admin-account';
import { createClient } from '@/lib/supabase/server';

export default async function Profile() {
  let name = defaultAdminDisplayName();
  let email = defaultAdminEmail();
  let lastSignIn: string | null = null;

  if (process.env.BYPASS_AUTH !== 'true') {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        name = resolveAdminDisplayName(user);
        if (user.email) email = user.email;
        if (user.last_sign_in_at) {
          lastSignIn = new Date(user.last_sign_in_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
        }
      }
    } catch {
      // Keep org defaults when auth client is unavailable.
    }
  }

  const readOnlyFields: { label: string; value: string }[] = [
    { label: 'Title', value: ADMIN_PROFILE.title },
    { label: 'Role', value: ADMIN_PROFILE.role },
    { label: 'Organization', value: ADMIN_PROFILE.organization },
  ];
  if (lastSignIn) {
    readOnlyFields.push({ label: 'Last sign-in', value: lastSignIn });
  }

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <ProfilePage
          initialName={name}
          initialEmail={email}
          readOnlyFields={readOnlyFields}
        />
      </SidebarDemo>
    </div>
  );
}
