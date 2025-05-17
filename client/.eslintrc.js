module.exports = {
  root: true,
  // Disable eslint to prevent the CommonJS/ESM conflict
  extends: ['react-app'],
  rules: {
    // Disable any rules that might cause issues
  },
  // This will bypass some of the problematic checks
  parser: "babel-eslint",
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ["@babel/preset-react"]
    }
  }
};
