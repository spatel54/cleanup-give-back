import { StyleSheet } from 'react-native';

/** Notification bell and other 24×24 app-bar icons. */
export const APP_BAR_ICON_SIZE = 24;

/**
 * Cart SVG is authored in 18×18 with more inset artwork — render slightly
 * larger so it optically matches the bell at {@link APP_BAR_ICON_SIZE}.
 */
export const APP_BAR_CART_ICON_SIZE = 28;

export const appBarIconWrap = StyleSheet.create({
  wrap: {
    width: APP_BAR_ICON_SIZE,
    height: APP_BAR_ICON_SIZE,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
}).wrap;
