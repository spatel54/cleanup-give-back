# Page 4 · Session Tracking

**Figma page:** `4·Session Tracking`  
**Figma node:** TBD — fill in after Figma MCP export.  
**Token binding status:** ✅ All text nodes bound (210 text layers; verified 2026-06-30).

## Screens (6)

| Route key | PRD § | Legacy HTML key | Status |
|-----------|-------|----------------|--------|
| `session-setup` | 6.9 | `session_setup___prd_aligned_standardized` | designed |
| `live-session` | 6.11 | `live_session___refined_map_tracker` | designed |
| `photo-checkpoint` | 6.12 | `photo_checkpoint` | designed |
| `photo-submitted` | 6.12 | `photo_submitted` | designed |
| `missed-checkpoint` | 6.13 | `restart_required` | designed |
| `submission-confirmation` | 6.15 | `submission_confirmation___prd_aligned` | designed |

## Flow

```
home → session-setup (Track FAB)
  → live-session (Continue / Start)
    → photo-checkpoint (Submit a photo)
      → photo-submitted (Take Photo)
        → live-session (Continue Tracking)
    → missed-checkpoint (missed checkpoint trigger)
    → submission-confirmation (End Session)
      → home (Submit for Approval / Continue)
```

## Notes

- **Permission screens** (`location_permission` `728:639`, `camera_permission` `728:658`) — title uses Sanchez Regular **30px** (matches `session_setup_guide` header `Description` text; not Display/Hero 34px). Implemented as `/session-setup-step6` / `/session-setup-step7`.
- Onboarding copies of the same frames live at `/location-permission` (`725:553`) and `/camera-permission` (`725:613`) in the create-account flow.
- `submission_confirmation___refined_design` is the retired duplicate of `submission_confirmation___prd_aligned`.
- Session Review (PRD §6.14) is a generated screen in `prototype/screens/session/SessionReview.tsx` — no Figma frame yet.
