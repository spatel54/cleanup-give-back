/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (_config) => ({
  type: 'widget',
  icon: '../../assets/images/icon.png',
  entitlements: {
    'com.apple.security.application-groups': ['group.com.example.cleanupgiveback'],
  },
  deploymentTarget: '26.0',
});
