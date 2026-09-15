import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/nav/Sidebar';
import { MobileNav } from '@/components/nav/MobileNav';
import { CommandPalette } from '@/components/nav/CommandPalette';
import { MainScrollReset } from '@/components/nav/MainScrollReset';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { getNavBadges } from '@/lib/nav-badges';
import { SessionExpiryBanner } from '@/components/SessionExpiryBanner';
import {
  defaultAdminDisplayName,
  initialsFromName,
  resolveAdminDisplayName,
} from '@/lib/admin-account';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let accountName = defaultAdminDisplayName();

  if (process.env.BYPASS_AUTH !== 'true') {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    if (user.user_metadata?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-bg-app flex items-center justify-center p-lg">
          <div className="text-center max-w-sm">
            <p className="font-heading text-[28px] text-text-primary mb-sm">Access denied</p>
            <p className="font-body text-base text-text-tertiary">
              This portal is for administrators only.
            </p>
          </div>
        </div>
      );
    }

    accountName = resolveAdminDisplayName(user);
  }

  const badges = await getNavBadges();
  const accountInitials = initialsFromName(accountName);

  return (
    <ToastProvider>
      <SessionExpiryBanner />
      <MainScrollReset />
      <CommandPalette />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex min-h-screen">
        <Sidebar badges={badges} accountName={accountName} accountInitials={accountInitials} />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav badges={badges} accountName={accountName} accountInitials={accountInitials} />
          <main id="main-content" tabIndex={-1} className="flex-1 p-lg lg:p-xl pb-20 lg:pb-xl overflow-x-hidden outline-none">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
