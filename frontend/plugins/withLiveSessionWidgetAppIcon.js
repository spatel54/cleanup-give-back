const { withXcodeProject } = require('expo/config-plugins');

const WIDGET_INFO_PLIST = 'live-session-widget/Info.plist';

/**
 * Widget Assets.xcassets uses AppIcon.appiconset (from @bacons/apple-targets).
 * Expo's expo.icon for the main app sets ASSETCATALOG_COMPILER_APPICON_NAME=expo
 * project-wide, which breaks livesessionwidget builds.
 */
module.exports = (config) =>
  withXcodeProject(config, (mod) => {
    const buildConfigs = mod.modResults.pbxXCBuildConfigurationSection();

    Object.values(buildConfigs).forEach((entry) => {
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) {
        return;
      }

      const infoPlist = entry.buildSettings.INFOPLIST_FILE;
      if (
        typeof infoPlist === 'string' &&
        infoPlist.includes(WIDGET_INFO_PLIST)
      ) {
        entry.buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME = 'AppIcon';
      }
    });

    return mod;
  });
