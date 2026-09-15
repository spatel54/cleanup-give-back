# Page 5 · Sessions History

**Figma page:** `5·Sessions History`  
**Figma node:** TBD — fill in after Figma MCP export.  
**Token binding status:** ✅ All text nodes bound (153 text layers; verified 2026-06-30).

## Screens (3)

| Route key | PRD § | Legacy HTML key | Status |
|-----------|-------|----------------|--------|
| `sessions-list` | 6.16 | `sessions_list___hybrid_redesign` | designed |
| `sessions-calendar` | 6.17 | `sessions_calendar_view___standardized_refined` | designed |
| `session-detail` | 6.18 | `session_detail` | implemented |

## Flow

```
home / bottom-nav Sessions
  → sessions-list
    ↔ sessions-calendar (Calendar / List toggle)
    → session-detail (View full details)
      → session-setup (Start Similar Session)
```

## Notes

- List ↔ Calendar is a toggle within the sessions section (not a full navigation push).
- `sessions_list_view___standardized_refined` is an earlier list layout — retired.
- `sessions_calendar_view___with_toggle` is an earlier calendar layout — retired.
- `session-detail` has no Stitch HTML original; it was generated from the PRD spec.
