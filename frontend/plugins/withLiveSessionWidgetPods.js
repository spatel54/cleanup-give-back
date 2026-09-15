const { withPodfile } = require('expo/config-plugins');

const MARKER = '# live-session-widget NitroActivityKitCore';

/** Link NitroActivityKitCore into the Live Activity widget extension target. */
module.exports = (config) =>
  withPodfile(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) {
      return mod;
    }

    mod.modResults.contents += `

${MARKER}
target 'livesessionwidget' do
  pod 'NitroActivityKitCore', :path => '../node_modules/@kingstinct/react-native-activity-kit'
end
`;

    return mod;
  });
