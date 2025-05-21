module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
    'import',
  ],
  settings: {
    react: {
      version: '17.0.2',
    },
  },
  rules: {
    // Common issues identified in the codebase
    'no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_', 
      'varsIgnorePattern': '^_'
    }],
    'react-hooks/exhaustive-deps': 'warn',
    'no-template-curly-in-string': 'warn',
    'no-mixed-operators': 'warn',
    'import/no-anonymous-default-export': 'warn',
    
    // React specific rules
    'react/prop-types': 'off', // Disable prop-types checking since we're just focusing on the main issues
    'react/react-in-jsx-scope': 'off', // React 17+ doesn't require importing React for JSX
    
    // Additional rules to improve code quality
    'no-console': 'warn',
    'prefer-const': 'warn',
    'eqeqeq': ['warn', 'always'],
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        // Rules specific to JS/JSX files
      }
    },
    {
      files: ['*.test.js', '*.test.jsx', '**/__tests__/**'],
      env: {
        jest: true,
      },
      rules: {
        // More relaxed rules for test files
        'no-console': 'off',
      }
    }
  ],
};
