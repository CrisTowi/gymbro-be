import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
    },
  },
  {
    ignores: ['node_modules/'],
  },
];
