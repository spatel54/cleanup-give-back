# Screen catalog

Browse UI previews and jump straight to the native source files in this repo. No external design tools required.

## How to use

- **Mobile previews** — static HTML mockups under [`frontend/design/stitch_htmls/`](../frontend/design/stitch_htmls/) with PNG thumbnails in [`mobile/previews/`](mobile/previews/).
- **Mobile implementation** — Expo Router route in [`frontend/src/app/`](../frontend/src/app/) re-exports a screen component from [`frontend/src/screens/`](../frontend/src/screens/) or [`frontend/src/features/`](../frontend/src/features/).
- **Admin implementation** — Next.js App Router page in [`admin-web-app/src/app/`](../admin-web-app/src/app/) with UI in [`admin-web-app/src/components/pages/`](../admin-web-app/src/components/pages/) (some detail routes inline in the page file).

Open any HTML preview locally: `open frontend/design/stitch_htmls/welcome___standardized_progress.html`

---

## Mobile — preview → code

| Screen | Preview | Route | Route file | Component |
|--------|---------|-------|------------|-----------|
| Account | [![preview](mobile/previews/account.png)](../../frontend/design/stitch_htmls/account.html) | `/account` | [`account.tsx`](../frontend/src/app/account.tsx) | [`AccountScreen.tsx`](../frontend/src/features/figma-screens/screens/AccountScreen.tsx) |
| Account details | [![preview](mobile/previews/account_details___standardized_progress.png)](../../frontend/design/stitch_htmls/account_details___standardized_progress.html) | `/account-details` | [`account-details.tsx`](../frontend/src/app/account-details.tsx) | [`AccountDetailsScreen.tsx`](../frontend/src/screens/AccountDetailsScreen.tsx) |
| Layout reference sheet | [![preview](mobile/previews/cleanup_giveback_redone_prd_full_layouts_md.png)](../../frontend/design/stitch_htmls/cleanup_giveback_redone_prd_full_layouts_md.html) | `—` | — | — |
| Create Account | [![preview](mobile/previews/create_account___standardized_progress.png)](../../frontend/design/stitch_htmls/create_account___standardized_progress.html) | `/create-account` | [`create-account.tsx`](../frontend/src/app/create-account.tsx) | [`CreateAccountScreen.tsx`](../frontend/src/screens/CreateAccountScreen.tsx) |
| Donate | [![preview](mobile/previews/donate.png)](../../frontend/design/stitch_htmls/donate.html) | `/donate` | [`donate.tsx`](../frontend/src/app/donate.tsx) | [`DonateScreen.tsx`](../frontend/src/features/figma-screens/screens/DonateScreen.tsx) |
| Donation history | [![preview](mobile/previews/donation_history.png)](../../frontend/design/stitch_htmls/donation_history.html) | `/donation-history` | [`donation-history.tsx`](../frontend/src/app/donation-history.tsx) | [`DonationHistoryScreen.tsx`](../frontend/src/features/figma-screens/screens/DonationHistoryScreen.tsx) |
| Export service record | [![preview](mobile/previews/export_service_record.png)](../../frontend/design/stitch_htmls/export_service_record.html) | `/export-service-record` | [`export-service-record.tsx`](../frontend/src/app/export-service-record.tsx) | [`ExportServiceRecordScreen.tsx`](../frontend/src/features/figma-screens/screens/ExportServiceRecordScreen.tsx) |
| Home | [![preview](mobile/previews/home_dashboard___final_branding.png)](../../frontend/design/stitch_htmls/home_dashboard___final_branding.html) | `/` | [`index.tsx`](../frontend/src/app/index.tsx) | [`HomeScreen.tsx`](../frontend/src/features/figma-screens/screens/HomeScreen.tsx) |
| Live session tracker | [![preview](mobile/previews/live_session___refined_map_tracker.png)](../../frontend/design/stitch_htmls/live_session___refined_map_tracker.html) | `/live-session` | [`live-session.tsx`](../frontend/src/app/live-session.tsx) | [`LiveSessionScreen.tsx`](../frontend/src/screens/LiveSessionScreen.tsx) |
| Notification preference | [![preview](mobile/previews/notification_preference___standardized_redo.png)](../../frontend/design/stitch_htmls/notification_preference___standardized_redo.html) | `/notification-preference` | [`notification-preference.tsx`](../frontend/src/app/notification-preference.tsx) | [`NotificationPreferenceScreen.tsx`](../frontend/src/screens/NotificationPreferenceScreen.tsx) |
| Notification settings | [![preview](mobile/previews/notification_settings___refined_toggles.png)](../../frontend/design/stitch_htmls/notification_settings___refined_toggles.html) | `/notifications` | [`notifications.tsx`](../frontend/src/app/notifications.tsx) | [`NotificationsScreen.tsx`](../frontend/src/features/figma-screens/screens/NotificationsScreen.tsx) |
| Order history | [![preview](mobile/previews/order_history.png)](../../frontend/design/stitch_htmls/order_history.html) | `/order-history` | [`order-history.tsx`](../frontend/src/app/order-history.tsx) | [`OrderHistoryScreen.tsx`](../frontend/src/features/figma-screens/screens/OrderHistoryScreen.tsx) |
| Photo checkpoint | [![preview](mobile/previews/photo_checkpoint.png)](../../frontend/design/stitch_htmls/photo_checkpoint.html) | `/photo-checkpoint` | [`photo-checkpoint.tsx`](../frontend/src/app/photo-checkpoint.tsx) | [`PhotoCheckpointScreen.tsx`](../frontend/src/screens/PhotoCheckpointScreen.tsx) |
| Product detail | [![preview](mobile/previews/product_detail__cleanup_kit___high_fidelity.png)](../../frontend/design/stitch_htmls/product_detail__cleanup_kit___high_fidelity.html) | `/product-detail` | [`product-detail.tsx`](../frontend/src/app/product-detail.tsx) | [`ProductDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/ProductDetailScreen.tsx) |
| Missed checkpoint | [![preview](mobile/previews/restart_required.png)](../../frontend/design/stitch_htmls/restart_required.html) | `/missed-checkpoint` | [`missed-checkpoint.tsx`](../frontend/src/app/missed-checkpoint.tsx) | [`MissedCheckpointScreen.tsx`](../frontend/src/screens/MissedCheckpointScreen.tsx) |
| Session setup | [![preview](mobile/previews/session_setup___prd_aligned_standardized.png)](../../frontend/design/stitch_htmls/session_setup___prd_aligned_standardized.html) | `/session-setup` | [`session-setup.tsx`](../frontend/src/app/session-setup.tsx) | [`SessionSetupFormScreen.tsx`](../frontend/src/screens/SessionSetupFormScreen.tsx) |
| Sessions calendar | [![preview](mobile/previews/sessions_calendar_view___standardized_refined.png)](../../frontend/design/stitch_htmls/sessions_calendar_view___standardized_refined.html) | `/sessions-list` | [`sessions-list.tsx`](../frontend/src/app/sessions-list.tsx) | [`SessionsScreen.tsx`](../frontend/src/features/figma-screens/screens/SessionsScreen.tsx) |
| Sessions calendar (toggle) | [![preview](mobile/previews/sessions_calendar_view___with_toggle.png)](../../frontend/design/stitch_htmls/sessions_calendar_view___with_toggle.html) | `/sessions-list` | [`sessions-list.tsx`](../frontend/src/app/sessions-list.tsx) | [`SessionsScreen.tsx`](../frontend/src/features/figma-screens/screens/SessionsScreen.tsx) |
| Sessions list | [![preview](mobile/previews/sessions_list_view___standardized_refined.png)](../../frontend/design/stitch_htmls/sessions_list_view___standardized_refined.html) | `/sessions-list` | [`sessions-list.tsx`](../frontend/src/app/sessions-list.tsx) | [`SessionsScreen.tsx`](../frontend/src/features/figma-screens/screens/SessionsScreen.tsx) |
| Shop | [![preview](mobile/previews/shop_home___prd___reference_aligned.png)](../../frontend/design/stitch_htmls/shop_home___prd___reference_aligned.html) | `/shop` | [`shop.tsx`](../frontend/src/app/shop.tsx) | [`ShopScreen.tsx`](../frontend/src/features/figma-screens/screens/ShopScreen.tsx) |
| Cart | [![preview](mobile/previews/shopping_cart__no_tote_bag_.png)](../../frontend/design/stitch_htmls/shopping_cart__no_tote_bag_.html) | `/cart` | [`cart.tsx`](../frontend/src/app/cart.tsx) | [`CartScreen.tsx`](../frontend/src/features/figma-screens/screens/CartScreen.tsx) |
| Submission confirmation | [![preview](mobile/previews/submission_confirmation___prd_aligned.png)](../../frontend/design/stitch_htmls/submission_confirmation___prd_aligned.html) | `/submission-confirmation` | [`submission-confirmation.tsx`](../frontend/src/app/submission-confirmation.tsx) | [`SubmissionConfirmationScreen.tsx`](../frontend/src/screens/SubmissionConfirmationScreen.tsx) |
| Submission confirmation (alt) | [![preview](mobile/previews/submission_confirmation___refined_design.png)](../../frontend/design/stitch_htmls/submission_confirmation___refined_design.html) | `/submission-confirmation` | [`submission-confirmation.tsx`](../frontend/src/app/submission-confirmation.tsx) | [`SubmissionConfirmationScreen.tsx`](../frontend/src/screens/SubmissionConfirmationScreen.tsx) |
| Purchase confirmation | [![preview](mobile/previews/thank_you___no_tote_bag_.png)](../../frontend/design/stitch_htmls/thank_you___no_tote_bag_.html) | `/purchase-confirmation` | [`purchase-confirmation.tsx`](../frontend/src/app/purchase-confirmation.tsx) | [`PurchaseConfirmationScreen.tsx`](../frontend/src/features/figma-screens/screens/PurchaseConfirmationScreen.tsx) |
| Welcome (alt) | [![preview](mobile/previews/welcome.png)](../../frontend/design/stitch_htmls/welcome.html) | `/welcome` | [`welcome.tsx`](../frontend/src/app/welcome.tsx) | [`WelcomeScreen.tsx`](../frontend/src/screens/WelcomeScreen.tsx) |
| Welcome | [![preview](mobile/previews/welcome___standardized_progress.png)](../../frontend/design/stitch_htmls/welcome___standardized_progress.html) | `/welcome` | [`welcome.tsx`](../frontend/src/app/welcome.tsx) | [`WelcomeScreen.tsx`](../frontend/src/screens/WelcomeScreen.tsx) |

---

## Mobile — all routes

| Screen | Route | Route file | Component |
|--------|-------|------------|-----------|
| Account Details | `/account-details` | [`account-details.tsx`](../frontend/src/app/account-details.tsx) | [`AccountDetailsScreen.tsx`](../frontend/src/screens/AccountDetailsScreen.tsx) |
| Account Phone | `/account-phone` | [`account-phone.tsx`](../frontend/src/app/account-phone.tsx) | [`AccountPhoneScreen.tsx`](../frontend/src/screens/AccountPhoneScreen.tsx) |
| Account Privacy | `/account-privacy` | [`account-privacy.tsx`](../frontend/src/app/account-privacy.tsx) | [`AccountPrivacyScreen.tsx`](../frontend/src/features/figma-screens/screens/AccountPrivacyScreen.tsx) |
| Account | `/account` | [`account.tsx`](../frontend/src/app/account.tsx) | [`AccountScreen.tsx`](../frontend/src/features/figma-screens/screens/AccountScreen.tsx) |
| Approval History | `/approval-history` | [`approval-history.tsx`](../frontend/src/app/approval-history.tsx) | [`ApprovalHistoryScreen.tsx`](../frontend/src/features/figma-screens/screens/ApprovalHistoryScreen.tsx) |
| Camera Permission | `/camera-permission` | [`camera-permission.tsx`](../frontend/src/app/camera-permission.tsx) | `frontend/src/app/camera-permission.tsx (inline: CameraPermissionRoute)` |
| Cart | `/cart` | [`cart.tsx`](../frontend/src/app/cart.tsx) | [`CartScreen.tsx`](../frontend/src/features/figma-screens/screens/CartScreen.tsx) |
| Checkout | `/checkout` | [`checkout.tsx`](../frontend/src/app/checkout.tsx) | [`CheckoutScreen.tsx`](../frontend/src/features/figma-screens/screens/CheckoutScreen.tsx) |
| Create Account | `/create-account` | [`create-account.tsx`](../frontend/src/app/create-account.tsx) | [`CreateAccountScreen.tsx`](../frontend/src/screens/CreateAccountScreen.tsx) |
| Creating Account | `/creating-account` | [`creating-account.tsx`](../frontend/src/app/creating-account.tsx) | [`CreatingAccountScreen.tsx`](../frontend/src/screens/CreatingAccountScreen.tsx) |
| Delete Account Confirm | `/delete-account-confirm` | [`delete-account-confirm.tsx`](../frontend/src/app/delete-account-confirm.tsx) | [`DeleteAccountScreen.tsx`](../frontend/src/features/figma-screens/screens/DeleteAccountScreen.tsx) |
| Device Permissions | `/device-permissions` | [`device-permissions.tsx`](../frontend/src/app/device-permissions.tsx) | [`DevicePermissionsScreen.tsx`](../frontend/src/screens/DevicePermissionsScreen.tsx) |
| Donate | `/donate` | [`donate.tsx`](../frontend/src/app/donate.tsx) | [`DonateScreen.tsx`](../frontend/src/features/figma-screens/screens/DonateScreen.tsx) |
| Donation History | `/donation-history` | [`donation-history.tsx`](../frontend/src/app/donation-history.tsx) | [`DonationHistoryScreen.tsx`](../frontend/src/features/figma-screens/screens/DonationHistoryScreen.tsx) |
| Event Detail | `/event-detail` | [`event-detail.tsx`](../frontend/src/app/event-detail.tsx) | [`EventDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/EventDetailScreen.tsx) |
| Export Record Success | `/export-record-success` | [`export-record-success.tsx`](../frontend/src/app/export-record-success.tsx) | [`ExportRecordSuccessScreen.tsx`](../frontend/src/features/figma-screens/screens/ExportRecordSuccessScreen.tsx) |
| Export Service Record | `/export-service-record` | [`export-service-record.tsx`](../frontend/src/app/export-service-record.tsx) | [`ExportServiceRecordScreen.tsx`](../frontend/src/features/figma-screens/screens/ExportServiceRecordScreen.tsx) |
| Feedback Thank You | `/feedback-thank-you` | [`feedback-thank-you.tsx`](../frontend/src/app/feedback-thank-you.tsx) | [`FeedbackThankYouScreen.tsx`](../frontend/src/screens/FeedbackThankYouScreen.tsx) |
| Free Hour | `/free-hour` | [`free-hour.tsx`](../frontend/src/app/free-hour.tsx) | [`FreeHourScreen.tsx`](../frontend/src/screens/FreeHourScreen.tsx) |
| Free Kit | `/free-kit` | [`free-kit.tsx`](../frontend/src/app/free-kit.tsx) | [`FreeKitScreen.tsx`](../frontend/src/screens/FreeKitScreen.tsx) |
| Free Trial Done | `/free-trial-done` | [`free-trial-done.tsx`](../frontend/src/app/free-trial-done.tsx) | [`FreeTrialModal.tsx`](../frontend/src/features/session-tracking/components/FreeTrialModal.tsx) |
| Give Feedback | `/give-feedback` | [`give-feedback.tsx`](../frontend/src/app/give-feedback.tsx) | [`FeedbackScreen.tsx`](../frontend/src/screens/FeedbackScreen.tsx) |
| Hold On | `/hold-on` | [`hold-on.tsx`](../frontend/src/app/hold-on.tsx) | [`HoldOnScreen.tsx`](../frontend/src/screens/HoldOnScreen.tsx) |
| Home Tour | `/home-tour` | [`home-tour.tsx`](../frontend/src/app/home-tour.tsx) | [`HomeTourScreen.tsx`](../frontend/src/screens/HomeTourScreen.tsx) |
| How It Works | `/how-it-works` | [`how-it-works.tsx`](../frontend/src/app/how-it-works.tsx) | [`HowItWorksScreen.tsx`](../frontend/src/screens/HowItWorksScreen.tsx) |
| Home | `/` | [`index.tsx`](../frontend/src/app/index.tsx) | [`AppSplashScreen.tsx`](../frontend/src/components/AppSplashScreen.tsx) |
| Letter Detail | `/letter-detail` | [`letter-detail.tsx`](../frontend/src/app/letter-detail.tsx) | [`LetterDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/LetterDetailScreen.tsx) |
| Letters | `/letters` | [`letters.tsx`](../frontend/src/app/letters.tsx) | [`LettersScreen.tsx`](../frontend/src/features/figma-screens/screens/LettersScreen.tsx) |
| Live Session | `/live-session` | [`live-session.tsx`](../frontend/src/app/live-session.tsx) | [`LiveSessionScreen.tsx`](../frontend/src/screens/LiveSessionScreen.tsx) |
| Location Permission | `/location-permission` | [`location-permission.tsx`](../frontend/src/app/location-permission.tsx) | `frontend/src/app/location-permission.tsx (inline: LocationPermissionRoute)` |
| Map Theme | `/map-theme` | [`map-theme.tsx`](../frontend/src/app/map-theme.tsx) | [`MapThemeScreen.tsx`](../frontend/src/screens/MapThemeScreen.tsx) |
| Missed Checkpoint | `/missed-checkpoint` | [`missed-checkpoint.tsx`](../frontend/src/app/missed-checkpoint.tsx) | [`MissedCheckpointScreen.tsx`](../frontend/src/screens/MissedCheckpointScreen.tsx) |
| Notification Preference | `/notification-preference` | [`notification-preference.tsx`](../frontend/src/app/notification-preference.tsx) | `frontend/src/app/notification-preference.tsx (inline: NotificationPreferenceRoute)` |
| Notifications | `/notifications` | [`notifications.tsx`](../frontend/src/app/notifications.tsx) | [`NotificationsScreen.tsx`](../frontend/src/features/figma-screens/screens/NotificationsScreen.tsx) |
| Order History | `/order-history` | [`order-history.tsx`](../frontend/src/app/order-history.tsx) | [`OrderHistoryScreen.tsx`](../frontend/src/features/figma-screens/screens/OrderHistoryScreen.tsx) |
| Orientation Complete | `/orientation-complete` | [`orientation-complete.tsx`](../frontend/src/app/orientation-complete.tsx) | [`FreeTrialModal.tsx`](../frontend/src/features/session-tracking/components/FreeTrialModal.tsx) |
| Personal Details | `/personal-details` | [`personal-details.tsx`](../frontend/src/app/personal-details.tsx) | [`PersonalDetailsScreen.tsx`](../frontend/src/features/figma-screens/screens/PersonalDetailsScreen.tsx) |
| Photo Capture | `/photo-capture` | [`photo-capture.tsx`](../frontend/src/app/photo-capture.tsx) | [`ageGate.tsx`](../frontend/src/constants/ageGate.tsx) |
| Photo Checkpoint | `/photo-checkpoint` | [`photo-checkpoint.tsx`](../frontend/src/app/photo-checkpoint.tsx) | [`ageGate.tsx`](../frontend/src/constants/ageGate.tsx) |
| Photo Submitted | `/photo-submitted` | [`photo-submitted.tsx`](../frontend/src/app/photo-submitted.tsx) | [`PhotoSubmittedScreen.tsx`](../frontend/src/screens/PhotoSubmittedScreen.tsx) |
| Privacy How We Protect It | `/privacy-how-we-protect-it` | [`privacy-how-we-protect-it.tsx`](../frontend/src/app/privacy-how-we-protect-it.tsx) | [`PrivacyPolicyDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/PrivacyPolicyDetailScreen.tsx) |
| Privacy How We Use It | `/privacy-how-we-use-it` | [`privacy-how-we-use-it.tsx`](../frontend/src/app/privacy-how-we-use-it.tsx) | [`PrivacyPolicyDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/PrivacyPolicyDetailScreen.tsx) |
| Privacy Policy | `/privacy-policy` | [`privacy-policy.tsx`](../frontend/src/app/privacy-policy.tsx) | [`PrivacyPolicyScreen.tsx`](../frontend/src/features/figma-screens/screens/PrivacyPolicyScreen.tsx) |
| Privacy What We Collect | `/privacy-what-we-collect` | [`privacy-what-we-collect.tsx`](../frontend/src/app/privacy-what-we-collect.tsx) | [`PrivacyPolicyDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/PrivacyPolicyDetailScreen.tsx) |
| Privacy Who We Share It With | `/privacy-who-we-share-it-with` | [`privacy-who-we-share-it-with.tsx`](../frontend/src/app/privacy-who-we-share-it-with.tsx) | [`PrivacyPolicyDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/PrivacyPolicyDetailScreen.tsx) |
| Product Detail | `/product-detail` | [`product-detail.tsx`](../frontend/src/app/product-detail.tsx) | [`ProductDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/ProductDetailScreen.tsx) |
| Purchase Confirmation | `/purchase-confirmation` | [`purchase-confirmation.tsx`](../frontend/src/app/purchase-confirmation.tsx) | [`PurchaseConfirmationScreen.tsx`](../frontend/src/features/figma-screens/screens/PurchaseConfirmationScreen.tsx) |
| Request Data Sent | `/request-data-sent` | [`request-data-sent.tsx`](../frontend/src/app/request-data-sent.tsx) | [`RequestDataSentScreen.tsx`](../frontend/src/features/figma-screens/screens/RequestDataSentScreen.tsx) |
| Request Data | `/request-data` | [`request-data.tsx`](../frontend/src/app/request-data.tsx) | [`RequestDataScreen.tsx`](../frontend/src/features/figma-screens/screens/RequestDataScreen.tsx) |
| Session Detail | `/session-detail` | [`session-detail.tsx`](../frontend/src/app/session-detail.tsx) | [`SessionDetailScreen.tsx`](../frontend/src/features/figma-screens/screens/SessionDetailScreen.tsx) |
| Session Feedback | `/session-feedback` | [`session-feedback.tsx`](../frontend/src/app/session-feedback.tsx) | [`FeedbackScreen.tsx`](../frontend/src/screens/FeedbackScreen.tsx) |
| Session Free Hour | `/session-free-hour` | [`session-free-hour.tsx`](../frontend/src/app/session-free-hour.tsx) | [`FreeHourScreen.tsx`](../frontend/src/screens/FreeHourScreen.tsx) |
| Session Free Kit | `/session-free-kit` | [`session-free-kit.tsx`](../frontend/src/app/session-free-kit.tsx) | [`FreeKitScreen.tsx`](../frontend/src/screens/FreeKitScreen.tsx) |
| Session Setup Complete | `/session-setup-complete` | [`session-setup-complete.tsx`](../frontend/src/app/session-setup-complete.tsx) | [`SessionSetupCompleteScreen.tsx`](../frontend/src/screens/SessionSetupCompleteScreen.tsx) |
| Session Setup Guide | `/session-setup-guide` | [`session-setup-guide.tsx`](../frontend/src/app/session-setup-guide.tsx) | [`SessionSetupGuideScreen.tsx`](../frontend/src/screens/SessionSetupGuideScreen.tsx) |
| Session Setup Step2 | `/session-setup-step2` | [`session-setup-step2.tsx`](../frontend/src/app/session-setup-step2.tsx) | [`SessionSetupStep2Screen.tsx`](../frontend/src/screens/SessionSetupStep2Screen.tsx) |
| Session Setup Step3 | `/session-setup-step3` | [`session-setup-step3.tsx`](../frontend/src/app/session-setup-step3.tsx) | [`SessionSetupStep3Screen.tsx`](../frontend/src/screens/SessionSetupStep3Screen.tsx) |
| Session Setup Step4 | `/session-setup-step4` | [`session-setup-step4.tsx`](../frontend/src/app/session-setup-step4.tsx) | [`SessionSetupStep4Screen.tsx`](../frontend/src/screens/SessionSetupStep4Screen.tsx) |
| Session Setup Step5 | `/session-setup-step5` | [`session-setup-step5.tsx`](../frontend/src/app/session-setup-step5.tsx) | [`SessionSetupStep5Screen.tsx`](../frontend/src/screens/SessionSetupStep5Screen.tsx) |
| Session Setup Step6 | `/session-setup-step6` | [`session-setup-step6.tsx`](../frontend/src/app/session-setup-step6.tsx) | [`SessionSetupStep6Screen.tsx`](../frontend/src/screens/SessionSetupStep6Screen.tsx) |
| Session Setup Step7 | `/session-setup-step7` | [`session-setup-step7.tsx`](../frontend/src/app/session-setup-step7.tsx) | [`SessionSetupStep7Screen.tsx`](../frontend/src/screens/SessionSetupStep7Screen.tsx) |
| Session Setup | `/session-setup` | [`session-setup.tsx`](../frontend/src/app/session-setup.tsx) | [`SessionSetupFormScreen.tsx`](../frontend/src/screens/SessionSetupFormScreen.tsx) |
| Session Tour | `/session-tour` | [`session-tour.tsx`](../frontend/src/app/session-tour.tsx) | [`SessionTourScreen.tsx`](../frontend/src/screens/SessionTourScreen.tsx) |
| Sessions List | `/sessions-list` | [`sessions-list.tsx`](../frontend/src/app/sessions-list.tsx) | [`SessionsScreen.tsx`](../frontend/src/features/figma-screens/screens/SessionsScreen.tsx) |
| Set Tour | `/set-tour` | [`set-tour.tsx`](../frontend/src/app/set-tour.tsx) | [`SetTourScreen.tsx`](../frontend/src/screens/SetTourScreen.tsx) |
| Setup Complete | `/setup-complete` | [`setup-complete.tsx`](../frontend/src/app/setup-complete.tsx) | [`SetupCompleteScreen.tsx`](../frontend/src/screens/SetupCompleteScreen.tsx) |
| Shop Tour | `/shop-tour` | [`shop-tour.tsx`](../frontend/src/app/shop-tour.tsx) | [`ShopTourScreen.tsx`](../frontend/src/screens/ShopTourScreen.tsx) |
| Shop | `/shop` | [`shop.tsx`](../frontend/src/app/shop.tsx) | [`ShopScreen.tsx`](../frontend/src/features/figma-screens/screens/ShopScreen.tsx) |
| Submission Confirmation | `/submission-confirmation` | [`submission-confirmation.tsx`](../frontend/src/app/submission-confirmation.tsx) | [`SubmissionConfirmationScreen.tsx`](../frontend/src/screens/SubmissionConfirmationScreen.tsx) |
| Tidy Man Preview | `/tidy-man-preview` | [`tidy-man-preview.tsx`](../frontend/src/app/tidy-man-preview.tsx) | [`TidyManPreviewScreen.tsx`](../frontend/src/screens/TidyManPreviewScreen.tsx) |
| Track Tour | `/track-tour` | [`track-tour.tsx`](../frontend/src/app/track-tour.tsx) | [`TrackTourScreen.tsx`](../frontend/src/screens/TrackTourScreen.tsx) |
| Tracker Paywall | `/tracker-paywall` | [`tracker-paywall.tsx`](../frontend/src/app/tracker-paywall.tsx) | [`FreeTrialModal.tsx`](../frontend/src/features/session-tracking/components/FreeTrialModal.tsx) |
| Under Age Learn Why | `/under-age-learn-why` | [`under-age-learn-why.tsx`](../frontend/src/app/under-age-learn-why.tsx) | [`UnderAgeLearnWhyScreen.tsx`](../frontend/src/screens/UnderAgeLearnWhyScreen.tsx) |
| Under Age | `/under-age` | [`under-age.tsx`](../frontend/src/app/under-age.tsx) | [`UnderAgeScreen.tsx`](../frontend/src/screens/UnderAgeScreen.tsx) |
| Welcome | `/welcome` | [`welcome.tsx`](../frontend/src/app/welcome.tsx) | [`WelcomeScreen.tsx`](../frontend/src/screens/WelcomeScreen.tsx) |

---

## Admin — pages

| Page | Route | Page file | Primary component |
|------|-------|-----------|-------------------|
| Dashboard | `/` | [`page.tsx`](../admin-web-app/src/app/page.tsx) | [`DashboardPage.tsx`](../admin-web-app/src/components/pages/DashboardPage.tsx) |
| Analytics | `/analytics` | [`page.tsx`](../admin-web-app/src/appanalytics/page.tsx) | [`AnalyticsPage.tsx`](../admin-web-app/src/components/pages/AnalyticsPage.tsx) |
| Attention inbox | `/attention` | [`page.tsx`](../admin-web-app/src/appattention/page.tsx) | [`AttentionInboxPage.tsx`](../admin-web-app/src/components/pages/AttentionInboxPage.tsx) |
| Audit log | `/audit-log` | [`page.tsx`](../admin-web-app/src/app/audit-log/page.tsx) | [`page.tsx`](../admin-web-app/src/app/audit-log/page.tsx) |
| Company codes | `/company-codes` | [`page.tsx`](../admin-web-app/src/app/company-codes/page.tsx) | [`page.tsx`](../admin-web-app/src/app/company-codes/page.tsx) |
| Dashboard | `/dashboard` | [`page.tsx`](../admin-web-app/src/appdashboard/page.tsx) | [`DashboardPage.tsx`](../admin-web-app/src/components/pages/DashboardPage.tsx) |
| Emails | `/emails` | [`page.tsx`](../admin-web-app/src/appemails/page.tsx) | [`EmailsPage.tsx`](../admin-web-app/src/components/pages/EmailsPage.tsx) |
| Events | `/events` | [`page.tsx`](../admin-web-app/src/appevents/page.tsx) | [`EventsPage.tsx`](../admin-web-app/src/components/pages/EventsPage.tsx) |
| Event detail | `/events/[id]` | [`page.tsx`](../admin-web-app/src/app/events/[id]/page.tsx) | [`EventDetailPage.tsx`](../admin-web-app/src/components/pages/EventDetailPage.tsx) |
| Edit event | `/events/[id]/edit` | [`page.tsx`](../admin-web-app/src/app/events/[id]/edit/page.tsx) | [`page.tsx`](../admin-web-app/src/app/events/[id]/edit/page.tsx) |
| New event | `/events/new` | [`page.tsx`](../admin-web-app/src/appevents/new/page.tsx) | [`NewEventPage.tsx`](../admin-web-app/src/components/pages/NewEventPage.tsx) |
| Feedback | `/feedback` | [`page.tsx`](../admin-web-app/src/appfeedback/page.tsx) | [`FeedbackPage.tsx`](../admin-web-app/src/components/pages/FeedbackPage.tsx) |
| Insights | `/insights` | [`page.tsx`](../admin-web-app/src/appinsights/page.tsx) | [`AnalyticsPage.tsx`](../admin-web-app/src/components/pages/AnalyticsPage.tsx) |
| Login | `/login` | [`LoginClient.tsx`](../admin-web-app/src/app/login/LoginClient.tsx) | [`LoginClient.tsx`](../admin-web-app/src/app/login/LoginClient.tsx) |
| Orders | `/orders` | [`page.tsx`](../admin-web-app/src/apporders/page.tsx) | [`OrdersPage.tsx`](../admin-web-app/src/components/pages/OrdersPage.tsx) |
| Order detail | `/orders/[id]` | [`page.tsx`](../admin-web-app/src/app/orders/[id]/page.tsx) | [`page.tsx`](../admin-web-app/src/app/orders/[id]/page.tsx) |
| Payments | `/payments` | [`page.tsx`](../admin-web-app/src/apppayments/page.tsx) | [`PaymentsPage.tsx`](../admin-web-app/src/components/pages/PaymentsPage.tsx) |
| Profile | `/profile` | [`page.tsx`](../admin-web-app/src/appprofile/page.tsx) | [`ProfilePage.tsx`](../admin-web-app/src/components/pages/ProfilePage.tsx) |
| Sessions | `/sessions` | [`page.tsx`](../admin-web-app/src/appsessions/page.tsx) | [`SessionsPage.tsx`](../admin-web-app/src/components/pages/SessionsPage.tsx) |
| Session compare | `/sessions/compare` | [`page.tsx`](../admin-web-app/src/appsessions/compare/page.tsx) | [`SessionCompareView.tsx`](../admin-web-app/src/components/pages/SessionCompareView.tsx) |
| Settings | `/settings` | [`page.tsx`](../admin-web-app/src/appsettings/page.tsx) | [`SettingsPage.tsx`](../admin-web-app/src/components/pages/SettingsPage.tsx) |
| Users | `/users` | [`page.tsx`](../admin-web-app/src/appusers/page.tsx) | [`VolunteersPage.tsx`](../admin-web-app/src/components/pages/VolunteersPage.tsx) |
| Volunteers | `/volunteers` | [`page.tsx`](../admin-web-app/src/appvolunteers/page.tsx) | [`VolunteersPage.tsx`](../admin-web-app/src/components/pages/VolunteersPage.tsx) |
| Volunteer detail | `/volunteers/[id]` | [`page.tsx`](../admin-web-app/src/app/volunteers/[id]/page.tsx) | [`page.tsx`](../admin-web-app/src/app/volunteers/[id]/page.tsx) |

---

## Related assets

- [`frontend/assets/stitch/`](../frontend/assets/stitch/) — bundled copies of the HTML previews used by the legacy prototype WebView route [`frontend/src/app/prototype/[screen].tsx`](../frontend/src/app/prototype/[screen].tsx)
- [`frontend/assets/images/screens/`](../frontend/assets/images/screens/) — per-flow illustration rasters (session setup, permissions, checkpoints)
- [`docs/frontend/design/live-activity-mockups/`](../frontend/design/live-activity-mockups/) — iOS Live Activity PNG mockups
