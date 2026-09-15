import {
  listCompanyCodes,
  type CompanyCodeRow,
} from '@/actions/companyCodes';
import { SidebarDemo } from '@/components/ui/sidebar-demo';
import { GenerateCompanyCodeButton } from './CompanyCodeActions';
import { CompanyCodesTable } from './CompanyCodesTable';

export const dynamic = 'force-dynamic';

export default async function CompanyCodesPage() {
  let codes: CompanyCodeRow[] = [];
  let loadError: string | null = null;
  try {
    codes = await listCompanyCodes();
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load company codes';
  }

  const activeCount = codes.filter((row) => row.status === 'active').length;

  return (
    <div className="w-full h-dvh">
      <SidebarDemo>
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between mb-lg">
            <div>
              <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">
                Company codes
              </h1>
              <p className="mt-xs font-body text-[14px] text-text-tertiary max-w-xl">
                Generate 10-digit single-use codes that unlock unlimited tracker access. Codes never
                expire; they become inactive after one redeem.
              </p>
            </div>
            <GenerateCompanyCodeButton />
          </header>

          {loadError ? (
            <div
              className="mb-lg rounded-sm border border-[#ba1a1a] bg-[#ffd9de] px-md py-sm font-body text-[13px] text-[#ba1a1a]"
              role="alert"
            >
              {loadError}
              <p className="mt-xs text-[12px]">
                Apply migration <code className="font-data">admin/db/029_company_codes.sql</code> on
                Supabase if the table is missing.
              </p>
            </div>
          ) : null}

          {!loadError ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg">
              <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
                <p className="font-data text-[12px] tracking-[0.96px] text-text-tertiary uppercase mb-sm">
                  Active codes
                </p>
                <p className="font-data text-[28px] font-semibold text-text-primary">{activeCount}</p>
                <p className="font-body text-[13px] text-text-tertiary mt-xs">Ready to share</p>
              </div>
              <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
                <p className="font-data text-[12px] tracking-[0.96px] text-text-tertiary uppercase mb-sm">
                  Total codes
                </p>
                <p className="font-data text-[28px] font-semibold text-text-primary">{codes.length}</p>
                <p className="font-body text-[13px] text-text-tertiary mt-xs">Including used</p>
              </div>
            </div>
          ) : null}

          {!loadError ? <CompanyCodesTable codes={codes} /> : null}
        </div>
      </SidebarDemo>
    </div>
  );
}
