const { withInfoPlist } = require('expo/config-plugins');

module.exports = (config) =>
  withInfoPlist(config, (mod) => {
    mod.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: true,
      NSAllowsLocalNetworking: true,
    };
    return mod;
  });
