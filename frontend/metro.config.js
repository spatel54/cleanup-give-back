const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle .html files as static assets (legacy Stitch prototype viewer).
config.resolver.assetExts.push('html', 'lottie', 'mov', 'gif', 'mp4');

// Listen on all interfaces so Expo Go on the same Wi‑Fi can reach Metro via LAN.
config.server = {
  ...(config.server ?? {}),
  host: '0.0.0.0',
};

module.exports = withNativeWind(config, { input: './global.css' });
