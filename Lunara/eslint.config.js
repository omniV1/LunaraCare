import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  { ignores: ['dist', 'node_modules', 'coverage', '*.config.js', '*.config.ts', 'src/tests/setup.ts', 'src/tests/types/**'] },
  // Main source files
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/tests/**/*', 'src/**/*.test.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        process: 'readonly',
        NodeJS: 'readonly',
        __VITE_API_BASE_URL__: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off', // Use TypeScript's rule instead
    },
  },
  // Test files
  {
    files: ['src/tests/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jest,
        process: 'readonly',
        NodeJS: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // More lenient in tests
      '@typescript-eslint/no-var-requires': 'off', // Allow require() in tests
      'no-unused-vars': 'off',
    },
  },
];
