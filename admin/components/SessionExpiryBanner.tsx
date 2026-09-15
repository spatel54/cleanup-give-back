'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function SessionExpiryBanner() {
  const [isExpired, setIsExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Check if user is still authenticated
        void supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) {
            setIsExpired(true);
            setTimeout(() => {
              router.push('/login?expired=true');
            }, 3000);
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (!isExpired) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-lg py-md rounded-md shadow-lg max-w-md mx-auto"
    >
      <p className="font-body text-[14px] font-semibold">
        Your session has expired. Redirecting to login...
      </p>
    </div>
  );
}
