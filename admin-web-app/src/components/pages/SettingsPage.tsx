/**
 * Admin has no dedicated Settings nav page beyond this one, loosely modeled on the
 * Account page's card/typography style. The Notifications section below is still a
 * placeholder (no real preferences wiring exists yet); Production Readiness is live -
 * see `lib/health-checks.ts` / `actions/health.ts` / `ProductionReadinessPanel.tsx`.
 */
import { runAllHealthChecks } from "@/lib/health-checks";
import { ProductionReadinessPanel } from "@/components/ui/ProductionReadinessPanel";

export async function SettingsPage() {
  const initialChecks = await runAllHealthChecks();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-lg">
      <header>
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Settings</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Preferences and system health for the CleanUpGiveBack admin portal.
        </p>
      </header>

      <ProductionReadinessPanel initialChecks={initialChecks} />

      <section className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="px-lg py-md border-b border-border-outline">
          <h2 className="font-heading text-[18px] text-text-primary">Notifications</h2>
        </div>
        <div className="divide-y divide-border-outline">
          {[
            { label: "New session submissions", value: "Email + in-app" },
            { label: "Court hours reminder", value: "Email" },
            { label: "Weekly summary", value: "Email" },
          ].map((row) => (
            <div key={row.label} className="px-lg py-md flex items-center justify-between gap-md">
              <span className="font-body text-[14px] text-text-primary">{row.label}</span>
              <span className="font-data text-[12px] text-text-tertiary">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="font-body text-[13px] text-text-tertiary">
        Notifications preferences are a placeholder - admin has no dedicated wiring for them today.
      </p>
    </div>
  );
}
