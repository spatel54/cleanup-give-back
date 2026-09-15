'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AccountSignOut() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="interactive min-h-11 px-lg rounded-sm border border-border-outline bg-bg-surface text-text-primary font-data text-[12px] font-semibold hover:bg-bg-app transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      Sign out
    </button>
  );
}
