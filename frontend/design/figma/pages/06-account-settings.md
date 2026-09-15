# Page 6 · Account & Settings

**Figma page:** `6·Account & Settings`  
**Figma node:** `627:373` (Account Flow section)  
**Token binding status:** ✅ All text nodes bound (226 text layers; verified 2026-06-30).

## Screens (10)

| Route key | PRD § | Legacy HTML key | Status |
|-----------|-------|----------------|--------|
| `account` | 6.25 | `account` | **implemented** (`569:896`) |
| `settings` | 6.26 | `settings` | designed |
| `privacy-security` | 6.27 | `privacy_security` | designed |
| `notification-settings` | 6.26 | `notification_settings___refined_toggles` | designed |
| `order-history` | 6.28 | `order_history` | **implemented** (`854:116`) |
| `donation-history` | 6.29 | `donation_history` | **bound** (`854:205`) |
| `export-service-record` | 6.30 | `export_service_record` | **bound** (`854:383`) |
| `approval-history` | 7 | `approval_history` | **bound** (`854:294`) |
| `account-privacy` | 6.37 | — | **missing** — manifest `723:405` not in file |
| `privacy-permissions` | 6.27 | — | **missing** — manifest `723:455` not in file |
| `settings` | 6.26 | — | **missing** — Stitch HTML only |

## `account-privacy` hub (§6.37)

**Entry:** Account → Preferences → Privacy (replaces direct link to `privacy-security`).

```text
┌─────────────────────────────────────┐
│ ← Privacy                           │
│                                     │
│ Your data                           │
│ ┌─────────────────────────────────┐ │
│ │ We collect photos and location  │ │
│ │ during sessions to verify your  │ │
│ │ service hours. Learn more →     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Legal                               │
│ Privacy Policy                   >  │
│ Terms of Service                 >  │
│                                     │
│ Your rights                         │
│ Request my data                  >  │
│ Request deletion                 >  │
│ Export service record            >  │
│                                     │
│ Controls                            │
│ App permissions                  >  │
│                                     │
│ We do not sell your personal        │
│ information.                        │
│                                     │
│ [Teen privacy tier badge]           │  ← only when privacy_tier = teen
└─────────────────────────────────────┘
```

Full decision record: [privacy-screen-split-decision.md](../../../docs/compliance/privacy-screen-split-decision.md).

## `privacy-permissions` (§6.27)

OS permissions only — Location, Camera, Notifications status + **Open Device Settings**. Split from legacy `privacy-security`. See wireframe in main PRD §6.27.

## Privacy Policy drill-down (§6.31 sub-screens)

Index frame `privacy_policy` (`728:995`) lists five sections. Each row navigates to a detail frame (template: `what-we-collect` `728:1295`).

| Frame name | Figma node | Status |
|------------|------------|--------|
| `privacy_policy` (index) | `728:995` | designed |
| `what-we-collect` | `728:1295` | designed |
| `how-we-use-it` | `735:101` | designed |
| `who-we-share-it-with` | `735:160` | designed |
| `how-we-protect-it` | `735:219` | designed |
| `request_data` (form — distinct layout) | `728:1385` | designed |
| `request_data_sent` (confirmation) | `728:1648` | **implemented** |

```text
privacy_policy (728:995)
  ├── what-we-collect (728:1295)
  ├── how-we-use-it (735:101)
  ├── who-we-share-it-with (735:160)
  ├── how-we-protect-it (735:219)
  └── request_data (728:1385) → request_data_sent (728:1648)
```

Copy is teen-friendly sample text per [mobile-app-privacy-policy-outline.md](../../../docs/compliance/mobile-app-privacy-policy-outline.md) — counsel review required before launch. Style: short sentences, plain words, no em dashes, grade 8–10 reading level.

## Flow

```
home → account (sidebar Account)
  → Preferences → Privacy → account-privacy (NEW hub)
    → privacy-policy
    → terms-of-service
    → privacy-rights-request
    → export-service-record
    → privacy-permissions
    → delete-account-confirm
  → settings (Settings)
    → privacy-security (legacy — pending split approval)
    → notification-settings (Notifications)
    → home (Log Out → welcome → home)
  → order-history (Order History)
  → donation-history (Donation History)
  → approval-history (Approval History)
```

## Records / Shop destination screens (built 2026-07-10)

The `account` (`569:896`) and `account_teen` (`728:1074`) Records card already had visible **Export Service Record** and **Approval History** rows, and the **Shop** card (`569:1462` in `account`, `840:357` in `account_teen`, un-hidden by product) already had visible **Order History** and **Donation History** rows — but none of the 4 destination frames existed in Figma before this pass; they only existed as legacy Stitch HTML mockups (`frontend/assets/stitch/*.html`) and PRD wireframe text. All 4 are now real frames in the Account Flow section (`627:373`), built by cloning the `notifications` frame shell (same `TopAppBar` + back-button + `Navbar`) and reusing Design System page (`1:3`) components — `StatusTag` (Approved/Pending/Declined variants) for status chips, `Input/State=Default` for form fields, and `Style=Primary` `Button` for the CTA — with every color, radius, and text style bound to the same Figma variables/text styles as sibling screens (`color/primary`, `color/status/*`, `color/border/outline`, `color/bg/surface`, `Headline/Detail`, `Data/Stat`, etc.), so they render as visually consistent, on-brand extensions of `account` rather than one-off mockups. `export-service-record` intentionally keeps the bottom `Navbar` (matching the sibling `request_data` form frame) even though the legacy HTML suppressed it for a linear task flow. Each Account/Shop row now carries a `NAVIGATE`-to-frame reaction to its destination, and every destination's back arrow carries the standard `BACK` reaction (inherited from the `notifications` clone) back to `account`.

`donation_history.html` (legacy Stitch mockup) is a copy-paste bug — it still shows order/product content under a "Donation History" title. The new `donation-history` Figma frame does **not** mirror that HTML; its content (date + Donation amount + confirmation) was built from PRD §6.29 directly.

## Prototype link audit (2026-07-10)

Verified via Figma MCP + Plugin API against `account` (`569:896`) and `account_teen` (`728:1074`).

### Linked from `account` / `account_teen` (NAVIGATE)

| Row | Source node | Destination | Status |
|-----|-------------|-------------|--------|
| Export Service Record | `728:1550` / `728:1528` | `export_service_record` (`854:383`) | ✅ |
| Approval History | `728:1558` / `728:1523` | `approval_history` (`854:294`) | ✅ |
| Order History | `569:1469` / `840:364` | `order_history` (`854:116`) | ✅ |
| Donation History | `569:1477` / `840:372` | `donation_history` (`854:205`) | ✅ |
| Notifications | `649:1016` / `728:1150` | `notifications` (`649:774`) | ✅ |
| Request Data | `728:1566` / `728:1525` | `request_data` (`728:1385`) | ✅ wired 2026-07-10 |
| Privacy | `569:1324` / `728:1157` | `privacy_policy` (`728:995`) | ⚠️ interim — target is `account-privacy` hub (frame missing) |
| Delete Account | `569:1251` / `728:1197` | `delete_account` (`725:361`) | ✅ wired 2026-07-10 |
| Log Out | `569:1245` / `728:1191` | `welcome` (`112:6776`) | ❌ blocked — `welcome` is on Page 1, not same Figma page |

Sub-screen back arrows use `BACK` reactions (not `NAVIGATE` → `account`). `request_data` Submit → `request_data_sent` (`728:1648`) is linked.

### Frames in Account Flow (`627:373`) — 16 total

`account`, `account_teen`, `notifications`, `delete_account`, `privacy_policy`, `what-we-collect`, `request_data`, `request_data_sent`, `export_record_success`, `how-we-use-it`, `who-we-share-it-with`, `how-we-protect-it`, `order_history`, `donation_history`, `approval_history`, `export_service_record`

### Documented but missing in Figma (node IDs in manifest are stale)

| routeKey | Manifest node | Status |
|----------|---------------|--------|
| `settings` | — | **No frame** — legacy Stitch HTML only |
| `account-privacy` | `723:405` | **Node not found** |
| `privacy-permissions` | `723:455` | **Node not found** |
| `terms-of-service` | `723:352` | **Node not found** |
| Page 7 compliance set | `722:51` … `723:378` | **Nodes not found** (except screens duplicated on Page 6 above) |

### `privacy_policy` index (`728:995`) — row copy vs destination mismatch

All five rows are linked, but titles do not match PRD section names or destination frame names:

| Row title (UI) | Links to | Expected frame |
|----------------|----------|----------------|
| How we use your data | `what-we-collect` (`728:1295`) | `what-we-collect` — title wrong |
| Data sharing | `how-we-use-it` (`735:101`) | `how-we-use-it` — title wrong |
| Data security | `who-we-share-it-with` (`735:160`) | `who-we-share-it-with` — title wrong |
| User rights | `how-we-protect-it` (`735:219`) | `how-we-protect-it` — title wrong |
| Changes to policy | `request_data` (`728:1385`) | no PRD section — consider retitle or relink |

### Token / variable issues (Account Flow)

| Issue | Where | Note |
|-------|-------|------|
| `color/text/on-primary` used as card/chrome fill | Records/Preferences cards, TopAppBar, Navbar | Should be `color/bg/surface` or `color/bg/app` |
| `color/text/nav-inactive` alias | De-emphasized text | Canonical token is `color/text/tertiary` (same hex `#3e4a3d`) |
| `color/bg/surface` resolves to `#ffffff` | Card fills | Design doc target is `#f6f3f2` — verify variable binding |
| `rounded-[12px]` on list rows / action buttons | Preferences rows, Log Out | No radius token (12px is manual per design.md) |
| `Label/Overline` on `order_history` | Section labels | Renders as Noto Sans 10px SemiBold — should be IBM Plex Sans 12px Medium |

Text layers: prior sweep reports **0 unbound** text on Page 6; issues above are **wrong-token** bindings, not missing variables.

## Notes

- Log Out cannot prototype-navigate to `welcome` until a Page 6 placeholder exists or cross-page navigation is configured. Delete Account now navigates to `delete_account` (`725:361`) in Figma (was unwired).
- **`account-privacy`** is the new Account-tab privacy hub — entry from Account → Preferences → Privacy. See [PRD §6.37](../../../docs/frontend/specs/cleanup_giveback_redone_prd_full_layouts.md) and [privacy-screen-split-decision.md](../../../docs/compliance/privacy-screen-split-decision.md).
- **`privacy-permissions`** replaces `privacy-security` for OS permissions only (§6.27).
- `privacy-security` legacy screen is **deprecated** — do not implement natively; split per decision doc.
