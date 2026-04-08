const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure that we can resolve .ts and .tsx files, even inside node_modules
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx', 'js', 'jsx', 'json'];

module.exports = config;
