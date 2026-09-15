# Session abuse / gaming checklist (agent thinking aid)

Use this when designing session trust features, admin review UX, court-hours flows, approval automation, or when evaluating whether a session looks legitimate. Court-ordered volunteers are higher-incentive abusers; treat them as the primary threat persona, not recreational volunteers.

**Evidence surfaces today:** GPS route polyline, wall-clock duration, distance, timed dual checkpoints (selfie + progress) with optional lat/lng, status (`under_review` / `approved` / `not_approved` / `invalid`), admin hours override + notes, service letter PDFs. Admin reviews in admin session drawer (walking path + photos).

**Do not** treat absence of automated fraud scores as “safe.” Human review + these questions are the current control plane.

---

## When to run this checklist

- [ ] Building or changing live session / checkpoint / finalize logic
- [ ] Building or changing admin approve/decline / hours adjust / letterhead
- [ ] Building court-order progress, exports, or filings-facing reports
- [ ] Proposing auto-approve, auto-metric, or “trust score” behavior
- [ ] Triaging a suspicious volunteer or session pattern for Admin

---

## 1. Movement / GPS — did a person actually walk a cleanup?

Ask:

- [ ] Is the path **walk-speed plausible**, or vehicle/bike-like (high speed, highway/road-aligned, long straight segments)?
- [ ] Is duration high but **distance near zero** (park-and-wait / phone left running)?
- [ ] Is distance high but **path is tight loops** (parking lot, driveway, hallway) with no corridor that looks like a litter walk?
- [ ] Do GPS points look **teleporting / mocked** (impossible jumps, perfect grid, constant absurd accuracy)?
- [ ] Are checkpoint pins **on the trail**, or clustered indoors / off-route from the claimed area?
- [ ] Was background GPS expected (EAS + Always) vs Expo Go foreground-only — gaps alone are not proof of fraud, but long unexplained gaps + big distance warrant skepticism.

**Common games:** phone in a car; GPS spoof apps; walking pointless loops; idle clock padding.

---

## 2. Photos — is the cleanup evidence live and real?

Ask:

- [ ] Do start / mid / end selfies look like the **same person**, under similar lighting/time, not a print/screen/TV?
- [ ] Do progress photos show **actual litter removal or trash collected**, not empty sidewalk or random clutter reused?
- [ ] Are progress scenes **repeated** across checkpoints (same pile, same angle, same bags)?
- [ ] Do photo capture times align with the **30‑minute checkpoint cadence** (plus grace), or bunch oddly?
- [ ] Do checkpoint GPS coords (when present) match the **route neighborhood** at that time?
- [ ] Could photos be **stock, gallery, or prior sessions** rather than live camera capture?

**Common games:** recycled photos; staged prop piles; selfie-of-a-selfie; friend’s face on the ordered person’s account.

---

## 3. Clock / process — are they farming hours vs doing work?

Ask:

- [ ] Hours claimed vs **cleanup signal** (photos + path shape) proportional?
- [ ] Pattern of **many short** easy-looking sessions, or **one long idle** session, aimed at court totals?
- [ ] History of **delete + resubmit** under-review sessions (approved cannot be volunteer-deleted)?
- [ ] Frequent discard/abandon (missing end photos) then requests for **manual credit**?
- [ ] Checkpoints barely met (photo every ~30m) with **minimal movement** between them?

**Common games:** wall-clock padding; checkpoint theater; delete-and-retry until the drawer looks clean.

---

## 4. Identity / court admin — is the ordered person the one earning credit?

Ask:

- [ ] Selfies consistent with known volunteer identity (when Admin has a reference)?
- [ ] Could a **substitute** walk with this phone/account?
- [ ] Court order hours / due date / case ref — does approving this session **overshoot** or look like padding past the order?
- [ ] Pressure for **hours override**, soft decline, or letterhead that exceeds map + photo evidence?
- [ ] Service letter reuse/alteration **outside the app** (PDF misuse) — in-app letters only for approved sessions?

**Common games:** proxy walker; social-engineering Admin; padding beyond court need; off-app letter edits.

---

## 5. Product / eng thinking — before shipping a trust-related change

Ask:

- [ ] Does this change make a **court-ordered** attacker’s easiest path harder, or only punish honest volunteers?
- [ ] Can the client still **lie** (GPS and photos are client-owned today)? Assume yes — design admin visibility accordingly.
- [ ] Are we relying on a metric that is **easy to maximize without cleanup** (duration, miles, photo count)?
- [ ] If auto-approving: what **false-approve** story are we accepting?
- [ ] Are decline reasons / notes enough for Admin to defend a decision to the court if asked?
- [ ] Does export / letter / hours adjust leave an **audit trail** (who changed what)?

---

## Quick red-flag bundle (session drawer)

Flag for closer human review when several apply:

1. High duration + low cleanup photo quality  
2. Route looks motorized or trivially looped  
3. Checkpoint photos look reused or off-route  
4. Selfie identity mismatch or low-effort selfies  
5. Court-ordered + near deadline + sudden session volume  
6. Repeated delete/resubmit or frequent discard/abandon → dispute  

One red flag ≠ decline. **Pattern + weak evidence** ≠ approve on faith.

---

## What already helps (do not regress)

- Timed dual checkpoints; grace miss → forced-end submit with start + end photos (mid optional; no auto-invalid / no flag)
- Route + checkpoint lat/lng on admin walking path
- Human approve before hours / letters count
- Approved sessions not volunteer-deletable
- Client Kalman/gates reduce jitter — not a spoofing defense

---

## Related

- Sessions domain: [docs/backend/context/sessions.md](../backend/context/sessions.md)
- Tracking spec: [docs/frontend/specs/session-tracking-expo-go.md](../frontend/specs/session-tracking-expo-go.md)
- Admin PRD (sessions / court): [docs/admin/admin-portal-prd-v3.md](../admin/admin-portal-prd-v3.md)
