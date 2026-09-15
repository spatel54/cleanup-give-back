module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // The installed @expo/ui canary build doesn't export `./babel-plugin`
          // (ERR_PACKAGE_PATH_NOT_EXPORTED) and the app doesn't use SwiftUI/
          // Jetpack Compose views, so skip resolving it.
          expoUi: false,
        },
      ],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
