// PROTOTYPE — NOT FINAL.
// Central asset registry — all require() calls in one place.
// Import from here rather than calling require() inline in components.

export const ProductImages = {
  safetyVest: require('../../assets/images/products/safety-vest.png'),
  trashGrabber: require('../../assets/images/products/trash-grabber.png'),
  nitrileGloves: require('../../assets/images/products/nitrile-gloves.png'),
} as const;

export const SceneImages = {
  welcomeBg: require('../../assets/images/scenes/welcome-bg.png'),
  mapRoute: require('../../assets/images/scenes/map-route.png'),
  volunteers: require('../../assets/images/scenes/volunteers.png'),
} as const;

export const LogoImages = {
  main: require('../../assets/images/logos/logo-main.png'),
  horizontal: require('../../assets/images/logos/logo-horizontal-322x88.jpg'),
  compact: require('../../assets/images/logos/logo-horizontal-328x64.jpg'),
  fullres: require('../../assets/images/logos/logo-fullres-1232x562.jpg'),
  icon78: require('../../assets/images/logos/logo-icon-78x94.jpg'),
  icon36: require('../../assets/images/logos/logo-icon-36x106.jpg'),
  wordmark198: require('../../assets/images/logos/logo-198x82.jpg'),
} as const;

export const MiscImages = {
  misc01: require('../../assets/images/misc/misc-01-736x920.png'),
  misc02: require('../../assets/images/misc/misc-02-736x552.png'),
  misc03: require('../../assets/images/misc/misc-03-780x1782.png'),
  misc04: require('../../assets/images/misc/misc-04-736x940.png'),
  misc05: require('../../assets/images/misc/misc-05-1200x675.png'),
  misc06: require('../../assets/images/misc/misc-06-780x794.png'),
  misc07: require('../../assets/images/misc/misc-07-876x3032.png'),
  misc08: require('../../assets/images/misc/misc-08-735x443.png'),
  misc09: require('../../assets/images/misc/misc-09-1200x902.png'),
  misc10: require('../../assets/images/misc/misc-10-1600x900.png'),
  misc11: require('../../assets/images/misc/misc-11-736x1104.png'),
  misc12: require('../../assets/images/misc/misc-12-788x3602.png'),
  misc13: require('../../assets/images/misc/misc-13-780x794.png'),
} as const;
