# Spec: Stripe Checkout (shop + donate)

**Date:** 2026-08-23  
**Status:** Implemented — Expo Go via hosted Checkout in system browser

## Summary

Shop checkout and standalone donate open **Stripe Checkout** in `expo-web-browser` (`openAuthSessionAsync`). Card fields are removed from checkout UI; Stripe collects payment. Tracker paywall checkout remains mock (`markTrackerPaid`).

Purchase confirmation and history screens read live Supabase rows (`shop_orders`, `donations`) for payment method and status — not cart mocks.

## User stories

- As a volunteer in Expo Go, I want to pay for shop items securely, so my order is recorded only after Stripe confirms payment.
- As a donor, I want to complete a contribution through Stripe, so admin Payments shows real donation revenue.
- As a volunteer, I want my receipt and history to show how I paid (card brand/last4 when available).

## Acceptance criteria

- [x] AC-1: Shop Place Order validates shipping only (no card fields); opens Stripe Checkout
- [x] AC-2: Successful pay → `clearCart` + `/purchase-confirmation?orderId=`
- [x] AC-3: Cancelled pay → stay on checkout; no confirmation
- [x] AC-4: Donate Continue opens Stripe Checkout; success → `/purchase-confirmation?mode=donation&donationId=&amount=`
- [x] AC-5: Tracker `?mode=tracker` unchanged (mock payment + `markTrackerPaid`)
- [x] AC-6: “powered by Stripe” footer retained (cart, checkout, donate, How it works Pay now)
- [x] AC-7: Purchase confirmation loads live order/donation row by id; shows `payment_method_label` or “Processing…” while webhook pending
- [x] AC-8: Order history shows payment method label on each card
- [x] AC-9: Donation history loads live `donations` via RLS; shows status + payment method; no false “email sent” chip on live rows

## Out of scope

- `@stripe/stripe-react-native` / in-app card fields
- Tracker IAP ($59.99)
- Donation receipt email

## Dependencies

- `frontend/src/lib/paymentsApi.ts`
- `backend/sessions` `/payments/*` routes
- `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (publishable unused for hosted Checkout but documented)
- `admin/db/023_stripe_checkout.sql` applied on Supabase
- `admin/db/024_stripe_payment_details.sql` applied on Supabase

## Test plan

1. Expo Go → cart → checkout → Place Order → Stripe test page → `4242 4242 4242 4242` → confirmation shows real line items + payment method
2. Donate $10 → Continue → pay → donation confirmation with live amount + payment method
3. Tracker free-hour → Continue → mock checkout still unlocks without Stripe
4. Cancel Stripe → returned to checkout/donate without confirmation
5. Order History / Donation History show live rows with payment method when set
