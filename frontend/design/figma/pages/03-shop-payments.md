# Page 3 · Shop & Payments

**Figma page:** `3·Shop & Payments`  
**Figma node:** [`77:4`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=77-4) (canvas) → section `Shop Flow` ([`627:166`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=627-166)) — resolved 2026-07-10.  
**Token binding status:** ✅ All text nodes bound (160 text layers; verified 2026-06-30).

## Screens (12)

| Route key | PRD § | Figma node (frame name) | Legacy HTML key | Status |
|-----------|-------|--------------------------|----------------|--------|
| `shop` | 6.19 | [`498:606`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=498-606) (`shop_home`) | `shop_home___prd___reference_aligned` | implemented |
| `product-detail` | 6.21 | [`492:114`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=492-114) (`shop_product_view` — Trash Cleanup Kit) | `product_detail__cleanup_kit___high_fidelity` | implemented |
| `product-detail/trash-grabber` | 6.21 | [`909:126`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=909-126) (`shop_product_view_trash_grabber`) | — | implemented |
| `product-detail/tote-bags` | 6.21 | [`905:166`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=905-166) (`shop_product_view_tote_bags` — Earth/Ocean color swatches) | — | implemented |
| `product-detail/adult-safety-vest` | 6.21 | [`905:236`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=905-236) (`shop_product_view_adult_safety_vest`) | — | implemented |
| `product-detail/child-safety-vest` | 6.21 | [`905:306`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=905-306) (`shop_product_view_child_safety_vest`) | — | implemented |
| `cart` | 6.22 | [`657:1585`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=657-1585) (`shop_checkout` — "Your Cart" screen despite the frame name) | `shopping_cart__no_tote_bag_` | implemented |
| `checkout` | 6.23 | [`657:1809`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=657-1809) (`shop_checkout_final`) | `checkout_form` | implemented |
| `purchase-confirmation` | 6.24 | [`494:262`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=494-262) (`shop_confirmation`) | `thank_you___no_tote_bag_` | implemented |
| `donate` | 6.20 | [`412:4`](https://www.figma.com/design/DrDcQH14n7ntDQ80F7au9S/CleanUpGiveBack?node-id=412-4) (`shop_donate`) | `donate` | implemented |
| `donation-checkout` | 6.20 | not yet located as a distinct frame — donation payment fields appear inline within `shop_checkout_final` | `donation_checkout` | designed |
| `donation-confirmation` | 6.20 | not yet located as a distinct frame — may reuse `shop_confirmation` | `donation_confirmation` | designed |

## Product pricing (verified against live site 2026-07-10)

Source of truth: [cleanupgiveback.org/products](https://cleanupgiveback.org/products) (catalog linked from [cleanupgiveback.org/shop](https://cleanupgiveback.org/shop)).

| Product (live-site name) | Figma `shop_home` card title | Detail frame | Price |
|--------------------------|------------------------------|--------------|-------|
| Trash Cleanup Kit | "Trash Clean Up Kit" (featured) | `492:114` | $29.99 |
| Reusable Tote Bags | "Reusable Tote Bags" | `905:166` (H1: Reusable Earth and Ocean Tote Bags) | $3.00 |
| Trash Grabber | "Trash Grabber" | `909:126` | $23.99 |
| Adult Safety Vest | "Adult Safety Vest" | `905:236` | $12.99 |
| Child Safety Vest | "Child Safety Vest" | `905:306` | $9.99 |

Corrected 2026-07-10 (prices): Tote Bags, "Adult Clean Up Kit", and "Child Clean Up Kit" cards on `shop_home` were all showing the placeholder price `$23.99` (copy-pasted from the Trash Grabber card). Updated in Figma directly to $3.00, $12.99, and $9.99 respectively via node IDs `515:1551`, `515:1599`, `515:1583`.

Added 2026-07-10 (product detail frames + naming): Duplicated `shop_product_view` (`492:114`) into four SKU frames in `Shop Flow` (`627:166`). Body copy pulled verbatim from [cleanupgiveback.org/products](https://cleanupgiveback.org/products). `shop_home` card titles renamed to live-site names (`515:1550`, `515:1598`, `515:1582`). Tote detail includes Earth/Ocean color swatches (`905:730` row). Hero images left as `#f0edec` placeholders — media deferred. Prototype: View buttons on `shop_home` → matching detail frames; back arrows → `498:606`.

## Flow — Shop

```
shop
  → product-detail (View / View Kit — per SKU frame; see table above)
    → cart (Add to Cart)
      → checkout (Checkout)
        → purchase-confirmation (Place Order)
          → shop (Continue Shopping)
          → home (Return to Home)
```

## Flow — Donate

```
shop
  → donate (Shop $5 / $10 / $15 / Custom → /donate?amount=…)
    → donation-checkout (Continue — not yet native)
      → donation-confirmation (Complete Donation)
        → home (Return to Home)
        → donation-history (View Donation History)
```

## Notes

- Product detail has a quantity counter (`qty_minus` / `qty_plus`) on every SKU frame.
- Tote Bags detail (`905:166`) has Earth (green) / Ocean (blue) color swatch circles; default Earth selected.
- Single-SKU product frames omit kit-only sections (Best Seller badge, thumbnail row, included-items list).
- Cart has per-row quantity counters.
- Shop has category filter buttons: All · Kits · Tools · Safety · Bags.
