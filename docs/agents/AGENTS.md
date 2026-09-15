# Agent instructions

Read the exact versioned Expo docs at https://docs.expo.dev/versions/v54.0.0/ before writing frontend code.

## Repository layout

| Area | Path |
|------|------|
| Expo app | `frontend/` |
| Admin console (production) | `admin-web-app/` |
| Legacy admin (archived) | `admin/` — do not deploy; keep `admin/db/*.sql` for Supabase migrations ([admin/README.md](../admin/README.md)) |
| Backend | `backend/sessions/` (live on Fly); `backend/{maps,payments}/` planned |
| Living docs | `docs/` — start at [README.md](../README.md) |
| Cursor config | `.cursor/` (repo root only) |

## Path aliases

- `@/*` → `frontend/src/*`
- `@/assets/*` → `frontend/assets/*`

---

## Project Identity

- **Stack:** Expo SDK 57, React Native 0.86, TypeScript, Expo Router.
- **Monorepo:** `frontend/` (app), `admin-web-app/` (admin console), `admin/` (archived — migrations only), `backend/` (services), `docs/` (living docs).
- **Builds:** EAS (development, preview, production). Location (`expo-location` + background task) and camera (`expo-camera`) plugins are configured in `frontend/app.json`.
- **Patched dependencies:** `frontend/patches/` is applied by `patch-package` via `postinstall`. Never install with `--ignore-scripts`, and regenerate a patch (`npx patch-package <pkg>`) after upgrading a patched package. Current: `expo-camera` for absolute camera zoom ([ADR-007](../adr/ADR-007-patched-expo-camera-zoom.md)).
- **Context docs:** `docs/` — start at [docs/README.md](../README.md).

---

## Code Conventions

Apply strictly to `**/*.tsx` and `**/*.ts`:

- **Routing:** Strictly use Expo Router (file-based navigation in `frontend/src/app/`). Stack roots include `(tabs)` and `+not-found.tsx`.
- **Styling:** Use React Navigation's Light/Dark theming. Use shared UI hooks `useColorScheme` and `useThemeColor`.
- **UI Components:** Default to `ThemedView`, `ThemedText`, and `Collapsible`. Colors and fonts follow [docs/frontend/brand.md](../frontend/brand.md) (Forest Green `#009540`, Sanchez, Noto Sans).

---

## Agent Workflow

1. **Spec-first:** Read or create specs in `docs/frontend/specs/` or `docs/backend/specs/` before any feature work.
2. **MCP-first for externals:** If the task needs GitHub, search, browser checks, or cross-session memory, use the matching MCP tool (see MCP table below). Read tool schemas before calling.
3. **Verify:** `cd frontend && npx tsc --noEmit` before marking done. Use Expo Go or EAS dev build for native checks.
4. **Sync docs:** Update living docs under `docs/` after every code or behavior change (see Documentation Backpressure below).
5. **Court / session trust work:** Read [session-abuse-checklist.md](session-abuse-checklist.md) before changing live sessions, checkpoints, admin approval, court-hours progress, service letters, or proposing auto-approve / trust scoring.

---

## MCP Tools

Use MCP tools when a task touches an external service, live web data, browser automation, or cross-session memory. Do not guess APIs — read the tool schema first, then call the tool.

| Task | Server | Examples |
|------|--------|---------|
| GitHub issues, PRs, code search | `github` | `search_issues`, `get_pull_request`, `search_code` |
| Web / local search | `brave-search` | `brave_web_search`, `brave_local_search` |
| Slack channels, history, post/reply | `slack` | `slack_list_channels`, `slack_post_message` |
| WhatsApp chats and messages | `whatsapp` | `list_chats`, `send_message`, `search_contacts` |
| Headless browser / web E2E | `playwright` | `browser_navigate`, `browser_snapshot` |
| Sanity schemas, GROQ, CMS docs | `plugin-sanity-Sanity` | `get_schema`, `query_documents`, `search_docs` |
| Cross-session project memory | `memory-bank` | `read_memory_bank_file`, `update_active_context` |
| Complex multi-step reasoning | `sequential-thinking` | `sequentialthinking` |

**Defaults:**
- Research & docs: use search before improvising from training data.
- GitHub: MCP for read/search/triage; `gh` CLI is fine for PR create/merge.
- Sanity: always `get_schema` before GROQ writes.
- If an MCP server is down, say so briefly, then use the next best option (`gh`, WebSearch). Do not use browser MCP to work around a missing integration.

---

## Documentation Backpressure

A task is **not complete** until living docs under `docs/` match the change.

**Templates:** `docs/frontend/context/TEMPLATE.md`, `docs/backend/context/TEMPLATE.md`, `docs/adr/template.md`, `docs/frontend/specs/TEMPLATE.md`, `docs/backend/specs/TEMPLATE.md`

**Index:** [docs/README.md](../README.md)

### After every code or behavior change

| Change type | Update |
|-------------|--------|
| Edits under `frontend/src/app/` | `docs/frontend/context/app.md` |
| Edits under `frontend/assets/` | `docs/frontend/context/assets.md` |
| Edits under `frontend/src/components/` | `docs/frontend/context/components.md` |
| Edits under `frontend/src/hooks/` or `frontend/src/constants/` | `docs/frontend/context/<scope>.md` if that scope file exists |
| New domain term or role | `docs/frontend/context/project.md` → Ontology |
| Local design choice | relevant `docs/frontend/context/*.md` → Decisions |
| Code pattern change | relevant `docs/frontend/context/*.md` → Patterns |
| New hard rule | relevant `docs/frontend/context/*.md` → Policies |
| Shipped feature with spec | matching `docs/frontend/specs/*.md` or `docs/backend/specs/*.md` — check ACs |
| Architecture decision | `docs/adr/ADR-NNN-*.md` + `docs/adr/overview.md` |
| Backend domain work | matching `docs/backend/context/*.md` |
| Completed planned work | `docs/implementation-plan.md` |
| End of session | `docs/progress.md` |
| User-visible capability changed | `docs/current.md` |
| Brand, UI tokens, or copy tone | `docs/frontend/brand.md` |
| Agent commands or repo layout | `docs/agents/AGENTS.md` (this file) |
| Product vision or setup | root `README.md` only |

### Verification before "done"

```bash
cd frontend && npx tsc --noEmit
npm run lint   # when relevant
npm test       # when relevant
```

### When unsure

- Spec exists? Check off ACs in `docs/*/specs/` before claiming done.
- Architectural change? Create an ADR and link from `docs/frontend/context/project.md`.
- What runs today changed? Update `docs/current.md`.
