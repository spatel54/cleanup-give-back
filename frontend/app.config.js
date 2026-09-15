module.exports = ({ config }) => {
  if (process.env.EXPO_PROTOTYPE === '1') {
    const prototypeJson = require('./prototype.json');
    return {
      ...config,
      ...prototypeJson.expo,
    };
  }
  return config;
};
