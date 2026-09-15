# Figma assets — per-screen inventory

Bundled screen assets for Expo. Metro resolves `@/assets/figma/...`.

**Raw Figma library dump (not bundled):** `frontend/design/figma/exports/library/`  
**Sync script:** `frontend/scripts/organize_screen_assets.py`

## Folder → screens

| Folder | Screens / use | Notes |
|--------|---------------|-------|
| `onboarding/` | Welcome, create account, creating account, phone/details, location/camera permission, notif prefs, setup complete, under-age | Hero PNG + auth/notif/permission SVGs |
| `tour/` | Home/shop/track/session/set tour | Stats/map/shop graphics + star/replay SVGs |
| `home-screen/` | Home dashboard (+ bottom nav under `nav/`) | Dashboard glyphs; nav SVGs are sources for `src/components/navigation/icons/` |
| `event-detail/` | Event detail + registration success | Icons, header/organizer PNGs, map stub |
| `shop/` | Shop home product thumbs | Featured/product PNGs |
| `shop/cart/` | Cart | Kit thumb + qty/trash/stripe SVGs |
| `shop/checkout/` | Checkout | Bag/truck/payments/shield SVGs |
| `shop/confirmation/` | Purchase confirmation | Hearts, receipt, kit thumb |
| `shop/donate/` | Shop donate card + Contribute | `thank-you-bags.webp` (shop card hero), contribute `hero.webp` + crown/recycle/heart SVGs |
| `shop/product-detail/` | Product detail | Per-SKU hero PNGs |
| `shop/_source/` | — | Ported glyph originals (not required at runtime) |
| `session-setup/` | Session setup form | Calendar / info / back SVGs |
| `live-session/` | Live tracker | Map controls + CTA SVGs; temporary Map Types thumbnails (`map-type-*.png`) |
| `photo-checkpoint/` | Photo checkpoint | See `images/screens/photo-checkpoint/` |
| `photo-submitted/` | Photo submitted | See `images/screens/photo-submitted/` + `animations/` |
| `missed-checkpoint/` | Missed checkpoint | See `images/screens/missed-checkpoint/` + `animations/` |
| `submission-confirmation/` | Submission confirmation | See `images/screens/submission-confirmation/` |
| `permissions/` | Location/camera permission steps | See `images/screens/permissions/` |
| `sessions-list/` | Sessions list | Search / sort / expand |
| `sessions-calendar/` | Sessions calendar (designed) | List-check glyph |
| `session-detail/` | Session detail | Back / share / hours / miles / photos |
| `account/` | Account + settings subflows | Section + row icons |
| `feedback-screen/` | Feedback (session-end + account Give Feedback) | Rating glyphs, chat header, typing-dot SVGs |
| `shared/` | Cross-screen brand / leftovers | Brand mark, vectors, generic checks |

## Raster companions

Screen photographs and illustrations that are not Figma SVG glyphs live under:

`frontend/assets/images/screens/<same-screen-key>/`

Animations: `frontend/assets/animations/`

## Policy

1. Prefer kebab-case filenames (`cart-icon.svg`, not `Cart Icon.svg`).
2. SVG icons used in RN are often ported to `react-native-svg` components — keep the SVG as source under the screen folder or `shop/_source/`.
3. Do not `require()` anything from `design/figma/exports/library/`.
