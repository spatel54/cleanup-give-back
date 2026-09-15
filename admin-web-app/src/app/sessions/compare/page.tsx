import Link from 'next/link';
import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { SessionCompareView } from '@/components/pages/SessionCompareView';
import { loadSessionsForCompare } from '@/lib/session-compare';
import { loadSessionEvidence } from '@/actions/sessions';
import { ChevronLeftIcon } from '@/components/ui/Icons';

export const dynamic = 'force-dynamic';

interface SearchParams {
  a?: string;
  b?: string;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-4xl mx-auto py-lg">
          <Link
            href="/sessions"
            className="font-data text-[12px] text-primary hover:underline mb-lg inline-flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" color="currentColor" />
            Sessions
          </Link>
          <div className="bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] px-lg py-md rounded-md">
            <h2 className="font-heading text-[18px] leading-[26px] mb-sm">Can&apos;t compare these sessions</h2>
            <p className="font-body text-[14px]">{message}</p>
          </div>
        </div>
      </SidebarDemo>
    </div>
  );
}

export default async function SessionComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { a, b } = await searchParams;
  if (!a || !b) {
    return <ErrorState message="Select two sessions to compare." />;
  }

  const sessions = await loadSessionsForCompare([a, b]);
  const sessionA = sessions.find((s) => s.id === a);
  const sessionB = sessions.find((s) => s.id === b);

  if (!sessionA || !sessionB) {
    return <ErrorState message="One or both sessions could not be found." />;
  }
  if (sessionA.userId !== sessionB.userId) {
    return <ErrorState message="Both sessions must belong to the same volunteer." />;
  }

  const [evidenceA, evidenceB] = await Promise.all([
    loadSessionEvidence(sessionA.id),
    loadSessionEvidence(sessionB.id),
  ]);

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <SessionCompareView sessionA={sessionA} sessionB={sessionB} evidenceA={evidenceA} evidenceB={evidenceB} />
      </SidebarDemo>
    </div>
  );
}
