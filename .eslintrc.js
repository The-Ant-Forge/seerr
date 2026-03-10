module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:jsx-a11y/recommended',
    'plugin:@next/next/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn', // disable the rule for now to replicate previous behavior
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-use-before-define': 0,
    'jsx-a11y/no-noninteractive-tabindex': 0,
    'arrow-parens': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'no-console': 1,
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
  overrides: [
    {
      files: ['**/*.tsx'],
      plugins: ['react'],
      rules: {
        'react/prop-types': 'off',
        'react/self-closing-comp': 'error',
      },
    },
  ],
  plugins: ['jsx-a11y', 'react-hooks', 'formatjs', 'no-relative-import-paths'],
  settings: {
    react: {
      pragma: 'React',
      version: '18',
    },
  },
  env: {
    browser: true,
    node: true,
    jest: true,
    es6: true,
  },
  reportUnusedDisableDirectives: true,
};
