# Budgeting Guide: Clean Up – Give Back

This guide explains real-world costs for running the app as a non-profit, in plain language. It’s designed to make budgeting and cost conversations simple.

---

## 1. Who Pays What?

- **Dev/build costs** (developer time, prototyping) are handled separately. This sheet is for **ongoing costs** the non-profit needs to plan for (accounts, hosting, app stores, infra).

- **Assumption:** The non-profit will own all app/service accounts, so billing stays with them after handoff.

---

## 2. One-Time (Upfront) Costs

| Item                        | Typical Cost                  |
|-----------------------------|-------------------------------|
| Google Play account         | **$25** (one-time)            |
| Apple Developer Program     | **$99** (annual) — often **waived for non-profits → $0** |
| Domain name (optional)      | **~$15**                      |
| Infra/service sign-up (Stripe, Supabase, Expo, Google Cloud) | **$0**                        |
| Infra buffer (3 months hosting + storage for test)         | **~$150–400**                 |
| Expo EAS paid plan (needed only for frequent builds)        | **$0 or $29/mo**              |

**Recommended upfront budget:** **$300–550** (could be as little as **$200–450** if Apple fee is waived)

*Tip: Even with a credit card on file for Google/Supabase, you’ll often pay nothing for several months using free tiers and credits.*

---

## 3. Yearly (Recurring) Costs

| Usage Level            | Who/When                  | Estimate            |
|------------------------|---------------------------|---------------------|
| **Lean**               | Testing, up to ~200 users | **$600–1,200/yr**   |
| **Moderate**           | 500–2,000 users           | **$1,500–3,500/yr** |
| **Growth**             | Heavy usage (>2k users)   | **$4,000–8,000/yr** |

**Breakdown for “Moderate” operation:**
- Apple Developer: **$99/yr** (waived if possible)
- Hosting (Railway/Fly.io): **~$120–300/yr**
- Supabase Pro (DB, Auth, Storage): **~$300/yr**
- Expo EAS (optional): **~$0–348/yr**
- Google Maps: **~$0–600/yr** (covered by $200/mo free credit initially)
- Email/push: **~$0–240/yr**
- **Stripe:** Only pay transaction fees (2.9% + $0.30 per donation/sale), **no monthly fee**
- **Support/maintenance:** If needed after handoff, contractor can cost **$2k–10k+/yr**

---

## 4. Minimum Budget To Launch (User Testing Phase)

- **$125–200 upfront** (covers Play + Apple dev accounts, with waiver)
- Credit card on file for required cloud services (usually billed $0 during early testing)
- **Year 1 operating cost:** Can stay **under $1,000** if usage remains low/free tiers

---

## 5. Suggested Budget (For Non-profit Planning)

| Category         | Safe Estimate              |
|------------------|---------------------------|
| Upfront          | **$500–750**              |
| Yearly (fixed)   | **$1,500–2,500/yr**       |
| Support/extra    | Stripe fees (on sales/donations), plus **$3k–5k/yr** if you want ongoing tech support after handoff

- **Note:** These “safe” numbers include nice-to-have upgrades and paid services.
- **Actual minimum** might be much less, especially during first year and testing.

---

## 6. What Actually Costs Money?

**You’ll definitely need:**
- **Apple Developer**: $99/year (but many non-profits get this waived)
- **Google Play account**: $25 (one time)

**Most other platforms:**
- Supabase, Railway/Fly, Expo: free for modest usage/testing
- Google Maps: $0 as long as you stay within the $200/mo free credit quota
- Stripe: no fixed fee—pay only on donations/sales

**BOTTOM LINE:** Your real **annual recurring cost can be as low as $0–99** during early launch/testing.

---

## 7. Why Plan a Bigger Budget?

The earlier “safe” budget allows breathing room:
- Upgrading to Supabase Pro (~$25/mo) earlier
- Paid hosting instead of free tier
- Expo EAS paid plan (if making lots of builds)
- Maps overage, support, rounding up for unexpected needs

**It is a “don’t get caught off guard” approach, not a true minimum.**

---

## 8. Typical Yearly Scenarios

| Situation                                   | Expected Fixed Cost    |
|----------------------------------------------|-----------------------|
| Early launch/user testing (free tiers)       | **$0–99/yr**          |
| Steady use/growing past free tiers           | **$300–800/yr**       |
| Heavy growth (many users, lots of photos)    | **$1,000–3,000/yr**   |

**Stripe and support are variable (based on number of donations or support needed).**

---

## 9. Takeaways

- The costs mostly **start low** and **only grow as the org’s usage grows**.
- Only the **Apple Developer fee** is a guaranteed recurring annual charge (sometimes $0).
- **Most infra and services are free** at small scale or low activity.
- A realistic ask: **$500 upfront, $100–500/yr** for normal operation; scale up spending only when usage increases.

Set up billing under the non-profit’s accounts right away, so there are no handoff surprises later!

---