export type PrivacySection = {
  title: string;
  body: string;
};

/** Effective date for the in-app privacy policy (draft product copy). */
export const PRIVACY_POLICY_EFFECTIVE_DATE = 'July 20, 2026';

/** Last-updated date and time shown on the privacy policy index and detail screens. */
export const PRIVACY_POLICY_LAST_UPDATED = 'September 1, 2026';

export type PrivacyPolicyIndexRow = {
  title: string;
  description: string;
  href:
    | '/privacy-what-we-collect'
    | '/privacy-how-we-use-it'
    | '/privacy-who-we-share-it-with'
    | '/privacy-how-we-protect-it';
};

/** Index rows on `/privacy-policy` (Figma privacy_policy / PRD §6.31). */
export const PRIVACY_POLICY_INDEX_ROWS: PrivacyPolicyIndexRow[] = [
  {
    title: 'What we collect',
    description:
      'We collect only what we need to run your account and verify service hours, such as account details, session photos, and GPS routes during active cleanups.',
    href: '/privacy-what-we-collect',
  },
  {
    title: 'How we use it',
    description:
      'We use your data to verify cleanup work, prevent fraud, process payments, and keep the app running. Location is tracked only during active sessions.',
    href: '/privacy-how-we-use-it',
  },
  {
    title: 'Who we share it with',
    description:
      'We share information only with technical processors that help run the app, and with authorized program reviewers who verify your hours.',
    href: '/privacy-who-we-share-it-with',
  },
  {
    title: 'How we protect it',
    description:
      'We use encryption, access controls, and clear retention limits. You can request a copy, correction, or deletion of your data.',
    href: '/privacy-how-we-protect-it',
  },
];

export const WHAT_WE_COLLECT_SECTIONS: PrivacySection[] = [
  {
    title: 'Who we are',
    body: 'Clean Up - Give Back is a registered 501(c)(3) nonprofit based in Des Plaines, Illinois. Our mobile app (iOS and Android) helps volunteers and court-ordered participants track, verify, and document community service hours. We collect only the data we need to run the app and verify your service hours.',
  },
  {
    title: 'Account details',
    body: 'When you create an account, we collect your legal name, email address, and phone number. You sign in with email and password or with Apple or Google (Supabase Auth). We use your name, email, and phone for profile creation, account management, official PDF service logs, and verification code (OTP) delivery when you change your email.',
  },
  {
    title: 'Service profile',
    body: 'We collect your service type (Court Ordered, Volunteering, School, or Other), activity type, session descriptions, session notes, and a digital signature image when you complete work in the app. Signature images may be printed on your official service-letter PDF. We use this for program matching, fraud prevention, and official service verification.',
  },
  {
    title: 'Ratings and feedback',
    body: 'If you rate or leave feedback about a session, we store that rating and comment. We use it to improve the program and follow up on issues.',
  },
  {
    title: 'Age screening',
    body: 'During signup we ask for your birth month and birth year only, not the day of the month. We use this to check that you are 13 or older (COPPA) and, if you are 13–17, to turn off session photos (start, checkpoint, and end-of-session pictures). If you are under 13, account creation is blocked and the signup details you entered are purged from the device without creating an account or storing them on our servers. If you are 13 or older, age fields may be stored with your account. We do not sell age data or use it for advertising.',
  },
  {
    title: 'Precise location (GPS)',
    body: 'While a cleanup session is active, we collect GPS route points, plus the coordinates of any checkpoints you reach along the way. GPS means your phone shares your position so we can verify service time, distance, and route, and help prevent fraud. We only collect location during an active session, not while the app is idle or after you finalize or cancel a session.',
  },
  {
    title: 'Photos',
    body: 'If you are 18 or older, during sessions you take live selfies and photos of collected trash or other proof of work. We use these to confirm you were present and completed community service. Authorized program and admin reviewers may see them to verify your hours. Volunteers aged 13–17 can still track GPS and hours, but session photos are turned off. An optional Account profile photo is separate from session checkpoints. We do not use your photos for advertising.',
  },
  {
    title: 'Session records',
    body: 'We also record session metadata: timestamps, duration, distance, any missed checkpoints, the map layer you used, approval status, and, when an admin reviewer adjusts your hours, adds a note, or declines a session, that adjustment, note, or reason. This is how your submitted work becomes an approved, auditable service record.',
  },
  {
    title: 'Payment and shipping',
    body: 'If you place a shop order, pay a program fee, or make a voluntary donation, we collect what the transaction requires. A mailing address is only collected if you choose USPS shipping. Office pickup and local drop-off do not require one. Payment is designed to run through Stripe, which never gives us your full card number; as of this policy, online checkout is still being built, and this section will be updated when it is live.',
  },
  {
    title: 'Device and diagnostic data',
    body: 'We may collect your app version, operating system, and IP address as part of standard network requests to our servers and the mapping, weather, and infrastructure providers listed in "Who we share it with." Optional crash logs may go to Apple, Google, and/or Expo when system diagnostics are enabled. This helps us fix bugs and keep the app stable.',
  },
  {
    title: 'Communications',
    body: 'If you opt in, we store a push notification token so Expo can deliver session alerts and program updates, and we log the content of notifications we send you (for example, an hours reminder or session-status alert) so we can show you your notification history. We also use your email for event registration confirmations, account notices, and verification codes (for example, email-change OTP). Transactional email is delivered by Resend, and we keep a log of messages sent to you.',
  },
  {
    title: 'Event registrations',
    body: 'If you register for an event in the app, we store your registration so we can confirm your spot and send related updates.',
  },
  {
    title: 'Company or program codes',
    body: 'If you join through a partner organization, we store the company or program code associated with your account so your hours can be matched to that program.',
  },
  {
    title: 'Court-order records',
    body: 'If your service is court-ordered, program administrators may maintain court-order records tied to your account (for example, ordered hours and program dates) so verified hours can be matched against what a court or program requires.',
  },
  {
    title: 'Data on your device',
    body: 'The app stores some data only on your phone, not on our servers: session notes you write, your map theme and other preferences, cached session records for offline viewing, whether you have unlocked paid tracker features, and a list of sessions you have deleted locally. This supports offline use. This local data is not shared with third parties.',
  },
  {
    title: 'Data promise',
    body: 'We do not sell or rent your personal information to third parties.',
  },
  {
    title: 'Children and teens',
    body: 'This app is not intended for children under 13. If an age under 13 is detected at signup, we block account creation and purge what you entered. Users aged 13–17 can track cleanup hours and GPS without taking session photos. Users aged 13 and older get the same high privacy defaults (for example, non-essential features and notification categories are opt-in). We do not use dark patterns to push you to share more data than you need to.',
  },
  {
    title: 'How long we keep your data',
    body: 'We aim to keep information only as long as needed for operations, verification, and legal requirements. Our targets: GPS route paths for about 90 days after session verification, photo evidence for about 1 year unless the law or a court order requires longer, and payment records up to 7 years for tax, accounting, and Stripe rules. These are targets we are actively building automated enforcement for. Until that ships, deletion happens on request and on account closure rather than automatically on a schedule. Account information lasts while your account is active, plus a grace period of about 30 days after you request closure, before we permanently delete it. Court-ordered logs are kept as required by applicable authorities and court programs, and may not be deletable on request.',
  },
  {
    title: 'Resources',
    body: 'The diagnostic and crash-reporting partners named above publish their own privacy policies:\n\nApple:\nhttps://www.apple.com/legal/privacy/en-ww/\n\nGoogle:\nhttps://policies.google.com/privacy\n\nExpo:\nhttps://expo.dev/privacy\n\nEmail:\nprivacy@example.org',
  },
];

export const HOW_WE_USE_IT_SECTIONS: PrivacySection[] = [
  {
    title: 'Overview',
    body: 'We use your information to run your account, verify cleanup work, process payments, send operational notices you expect, and keep the app safe. We only use data for purposes that support these features.',
  },
  {
    title: 'Run your account',
    body: 'Your name, email, phone, and related account details let you sign in, manage your profile, and generate official PDF service logs.',
  },
  {
    title: 'Verify cleanup work',
    body: 'Photos, GPS routes, session descriptions, activity type, court-ordered status, and digital signatures help us confirm where and when you worked. Reviewers use this information to approve community service hours and help prevent fraud.',
  },
  {
    title: 'Age eligibility',
    body: 'Birth month and year are used only to estimate age for COPPA compliance, to decide whether signup may continue, and to turn session photos on only for volunteers 18 and older.',
  },
  {
    title: 'Process payments',
    body: 'Mailing address (for USPS shipping) and payment details (via Stripe) will let you complete shop orders, program fees, and donations. We do not store your full card number. Online checkout is still being built as of this policy.',
  },
  {
    title: 'Keep the app stable',
    body: 'App version, operating system, and optional crash logs help us find bugs and improve stability.',
  },
  {
    title: 'Send you notices',
    body: 'If you turn notifications on, we use your push token for real-time session and program alerts. We use email for registration confirmations, verification codes, and other account notices. You can change notification settings in the app.',
  },
  {
    title: 'Offline use',
    body: 'Session notes, preferences, and cached session records stored on your device let you view past sessions and keep parts of the app working offline.',
  },
  {
    title: 'Location tracking (session only)',
    body: 'We do not track your location while the app is idle or after a session is finalized or canceled. GPS collection starts only when you explicitly start a cleanup session (for example, tapping “Start Cleanup”). If you grant Always location access, the app may keep mapping your route while the screen is locked, but only while a cleanup session remains active. Tracking stops as soon as you complete or cancel the session. A prominent on-screen indicator shows whenever active location tracking is running. Maps are drawn on your device with MapLibre. Standard basemaps load from CARTO; Satellite and Hybrid views use Esri imagery. Those providers receive standard network metadata (such as IP address) to serve map tiles. They do not receive or store your recorded walking routes. Approximate weather for an active session may come from Open-Meteo based on starting coordinates.',
  },
  {
    title: 'What we do not do',
    body: 'We do not sell or rent your personal information. We do not use your photos or location for advertising. We do not collect more data than we need to run the app and verify your cleanup work.',
  },
  {
    title: 'Resources',
    body: 'See how these partners handle data:\n\nStripe:\nhttps://stripe.com/privacy\n\nExpo:\nhttps://expo.dev/privacy\n\nEmail:\nprivacy@example.org',
  },
];

export const WHO_WE_SHARE_IT_WITH_SECTIONS: PrivacySection[] = [
  {
    title: 'Overview',
    body: 'We share data only with technical processors needed to run the app, with authorized program reviewers who verify hours, or when the law requires it (for example, a valid court order, safety protection, or fraud investigation). We do not sell your information to data brokers or advertisers.',
  },
  {
    title: 'Supabase',
    body: 'Supabase hosts user accounts, session metadata, and uploaded photo evidence (database, auth, and media storage). Supabase does not process your data for advertising.',
  },
  {
    title: 'Fly.io',
    body: 'Fly.io hosts our Session API in the United States. That API manages cleanup sessions, finalized GPS routes, and related metadata.',
  },
  {
    title: 'Stripe',
    body: 'Stripe is designed to process financial transactions, billing details, and identity checks for payment processing and anti-money laundering (AML) controls. Full payment card numbers would never be stored on our servers. Online checkout is still being built as of this policy; this section will be updated when it goes live.',
  },
  {
    title: 'CARTO and Esri',
    body: 'CARTO and Esri deliver basemap imagery rendered with MapLibre. Exposure is limited to standard web requests (for example, IP address) needed to load map tiles. They do not receive your walking routes.',
  },
  {
    title: 'MapLibre',
    body: 'MapLibre is an open-source mapping library that runs on your device to draw the map interface. It is client-side software, not a cloud store for your routes.',
  },
  {
    title: 'Open-Meteo',
    body: 'Open-Meteo provides approximate weather details for active sessions based on starting coordinates. Server logs that may include IP addresses or coordinates are purged within about 90 days.',
  },
  {
    title: 'Resend',
    body: 'Resend delivers transactional emails: account registration and approval/decline notices, hours-reminder emails, email-change verification codes, forgot-password emails, and shop order confirmations. Resend processes the recipient address and message content needed to send that email.',
  },
  {
    title: 'Expo',
    body: 'Expo provides mobile app infrastructure and routes push notification tokens when notifications are enabled.',
  },
  {
    title: 'Apple and Google',
    body: 'Apple and Google manage system-level permissions, app delivery through their stores, and optional platform crash reporting.',
  },
  {
    title: 'Vercel',
    body: 'Vercel hosts our admin console, which authorized program staff use to review volunteer profiles, sessions, photos, and court-order records.',
  },
  {
    title: 'OpenStreetMap, Photon, Nominatim, and US Census',
    body: 'When staff generate a service-letter map or look up an address in the admin console, we may send that address or set of coordinates to OpenStreetMap (static maps), Photon or Nominatim (Komoot geocoding), or the US Census geocoder. We may also use Google Places for admin address search. These providers receive only the address or coordinates being looked up.',
  },
  {
    title: 'Authorized program administrators',
    body: 'Trained staff and program reviewers may inspect session photos, routes, notes, signatures, and logs solely to verify and approve community service hours.',
  },
  {
    title: 'Courts, probation offices, schools, and employers',
    body: 'If your service is court-ordered or otherwise requires verification, we may share your service-letter PDF (which can include your name, completed hours, session dates, route maps, and photos) with the requesting court, probation office, school, or employer. We may not be able to delete these logs on request; see "How long we keep your data."',
  },
  {
    title: 'When the law requires it',
    body: 'We may share information if legally compelled (for example, a valid court order) or to protect safety or investigate fraud.',
  },
  {
    title: 'We do not sell your data',
    body: 'We do not sell or monetize personal information. Geolocation and photo data are used only for service verification. Our processors may use your information only as needed to provide their services to Clean Up - Give Back, not to sell it or use it for their own advertising.',
  },
  {
    title: 'Resources',
    body: 'Privacy policies for the processors named above:\n\nSupabase:\nhttps://supabase.com/privacy\n\nFly.io:\nhttps://fly.io/legal/privacy-policy/\n\nStripe:\nhttps://stripe.com/privacy\n\nResend:\nhttps://resend.com/legal/privacy-policy\n\nExpo:\nhttps://expo.dev/privacy\n\nCARTO:\nhttps://carto.com/privacy/\n\nEsri:\nhttps://www.esri.com/en-us/privacy/overview\n\nOpen-Meteo:\nhttps://open-meteo.com/en/terms\n\nVercel:\nhttps://vercel.com/legal/privacy-policy\n\nOpenStreetMap Foundation:\nhttps://osmfoundation.org/wiki/Privacy_Policy\n\nApple:\nhttps://www.apple.com/legal/privacy/en-ww/\n\nGoogle:\nhttps://policies.google.com/privacy\n\nEmail:\nprivacy@example.org',
  },
];

export const HOW_WE_PROTECT_IT_SECTIONS: PrivacySection[] = [
  {
    title: 'Overview',
    body: 'We protect your data with industry-standard measures. No system is perfectly secure, but we take clear steps to reduce risk.',
  },
  {
    title: 'Encryption and access controls',
    body: 'Data is encrypted in transit (TLS 1.2/1.3) and encrypted at rest across our cloud storage providers. We use Row-Level Security (RLS) policies so users can access only their own personal records. Only approved staff can access user data when needed for support, security, verification, or legal compliance.',
  },
  {
    title: 'How long we keep data',
    body: 'We target about 90 days for GPS route paths after session verification, about 1 year for photo evidence unless extended by law or court order, and up to 7 years for payment records. We are still building automated jobs to enforce these targets; until then, deletion happens on request and on account closure. Account information lasts for the life of an active account plus about a 30-day grace period after closure. Court-ordered logs follow applicable legal and program requirements.',
  },
  {
    title: 'Your privacy rights',
    body: 'Regardless of where you live, we extend core privacy rights to all app users. Access and portability: request a copy of your personal data, or export your approved sessions as a PDF service record directly in the app. Correction: update your name, email, or phone in the app (email changes require a verification code), or ask us to fix other inaccurate details. Deletion: request erasure of your account and associated personal data, subject to legal or court-mandated retention. Non-discrimination: we will not degrade app performance or treat you differently for exercising these rights. Do not sell: we do not sell or monetize personal information.',
  },
  {
    title: 'How to exercise your rights',
    body: 'You can start an access, correction, or deletion request in the app under Account → Preferences → Privacy, or by emailing our privacy team at privacy@example.org. Deletion and full data-export requests are currently reviewed and completed by our team rather than processed instantly. We log every request and its outcome, and we will tell you if any court-mandated records must be retained.',
  },
  {
    title: 'Your role',
    body: "Do not share your device or login access with others. Turn on your phone's screen lock. Use a strong password you do not reuse elsewhere. Contact us right away if you think someone else accessed your account.",
  },
  {
    title: 'If something goes wrong',
    body: 'Email privacy@example.org if you think your data was accessed without permission. Tell us what happened and we will investigate. We will also explain steps you can take to protect your account.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this policy when the app, our technology, or the law changes. Material updates, especially about location tracking or data collection, will be communicated through in-app notices or direct user alerts.',
  },
  {
    title: 'Contact us',
    body: 'Organization: Clean Up - Give Back. Email: privacy@example.org. Mailing address: Clean Up - Give Back, Des Plaines, IL.',
  },
  {
    title: 'Resources',
    body: 'In the app:\nAccount → Preferences → Privacy\n\nWhat TLS 1.2/1.3 is:\nhttps://developer.mozilla.org/en-US/docs/Glossary/TLS\n\nWhat Row-Level Security (RLS) is:\nhttps://supabase.com/docs/guides/database/postgres/row-level-security\n\nEmail:\nprivacy@example.org',
  },
];
