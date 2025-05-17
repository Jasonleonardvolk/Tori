// Custom transformer for Jest in client directory
const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: ['@babel/plugin-syntax-jsx'],
  babelrc: false,
  configFile: false
});
