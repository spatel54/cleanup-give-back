// https://docs.expo.dev/guides/using-eslint/
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    rules: {
      // Product copy uses apostrophes in JSX text; not worth entity escapes in RN.
      'react/no-unescaped-entities': 'off',
    },
  },
];
