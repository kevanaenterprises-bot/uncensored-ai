import eslintPluginPrettier from 'eslint-plugin-prettier';
import typescriptEslintParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...typescriptEslintPlugin.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'warn', // Changed to warn instead of error
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
