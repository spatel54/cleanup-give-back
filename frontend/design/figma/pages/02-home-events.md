# Page 2 · Home & Events

**Figma page:** `2·Home & Events`  
**Figma node:** TBD — fill in after Figma MCP export.  
**Token binding status:** ✅ All text nodes bound (92 text layers; verified 2026-06-30).

## Screens (2)

| Route key | PRD § | Legacy HTML key | Status |
|-----------|-------|----------------|--------|
| `home` | 6.7 | `home_hamburger` | designed |
| `event-detail` | 6.8 | `events_detail` | designed |

## Flow

```
home
  → event-detail (View All → event card)
    → home (Register for this Event)
  → session-setup (Track FAB / bottom nav)
  → sessions-list (Sessions / bottom nav)
  → shop (Shop sidebar item)
  → account (Account sidebar item)
```

## Notes

- Bottom nav: 3 items — **Home** · **Track** (FAB) · **Sessions**.
- Sidebar (hamburger): Shop, Account links.
- `home_dashboard___final_branding` is an earlier layout iteration; `home_hamburger` is canonical.
- Session cards on Home navigate to `session-detail`.
- Activity bar chart bars navigate to `sessions-list`.
