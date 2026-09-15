const { withXcodeProject } = require('expo/config-plugins');

module.exports = (config) =>
  withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const buildConfigs = project.pbxXCBuildConfigurationSection();

    Object.values(buildConfigs).forEach((config) => {
      if (config && typeof config === 'object' && config.buildSettings) {
        config.buildSettings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO';
      }
    });

    return mod;
  });
