const { override, addWebpackPlugin } = require('customize-cra');
const NodePolyfillPlugin = require('webpack-plugin-node-polyfills');

module.exports = override(
  addWebpackPlugin(
    new NodePolyfillPlugin({
      excludeAliases: ['console'], // Exclude if not needed, 'console' is usually available
    })
  )
);