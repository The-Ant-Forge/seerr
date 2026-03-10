const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const formatjsModule = require('eslint-plugin-formatjs');
const formatjsPlugin = formatjsModule.default || formatjsModule;
const noRelativeImportPaths = require('eslint-plugin-no-relative-import-paths');
const globals = require('globals');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  // Base recommended rules
  js.configs.recommended,

  // TypeScript recommended (via compat since plugin uses legacy format)
  ...compat.extends('plugin:@typescript-eslint/recommended'),

  // Next.js recommended (legacy config, needs compat)
  ...compat.extends('plugin:@next/next/recommended'),

  // jsx-a11y recommended
  ...compat.extends('plugin:jsx-a11y/recommended'),

  // Prettier must be last to override formatting rules
  ...compat.extends('prettier'),

  // Main config for all TS/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'react-hooks': reactHooksPlugin,
      formatjs: formatjsPlugin,
      'no-relative-import-paths': noRelativeImportPaths,
    },
    settings: {
      react: {
        pragma: 'React',
        version: '18',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'arrow-parens': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'no-console': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'formatjs/no-offset': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      'jsx-a11y/no-onchange': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: true },
      ],
    },
  },

  // TSX-specific rules
  {
    files: ['**/*.tsx'],
    plugins: {
      react: reactPlugin,
    },
    rules: {
      'react/prop-types': 'off',
      'react/self-closing-comp': 'error',
    },
  },

  // Ignore patterns
  {
    ignores: ['node_modules/', '.next/', 'dist/', 'config/'],
  },
];
