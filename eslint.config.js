const tseslintParser = require('@typescript-eslint/parser')
const tseslintPlugin = require('@typescript-eslint/eslint-plugin')
const eslintPluginImport = require('eslint-plugin-import')
const eslintConfigPrettier = require('eslint-config-prettier')

module.exports = [
  {
    ignores: [
      'apps/*/dist/',
      'apps/*/node_modules/',
      'apps/*/.next/',
      'apps/*/*.config.ts',
      'apps/*/*.config.cjs',
    ],
  },
  {
    files: ['apps/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      import: eslintPluginImport,
    },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules,
      ...eslintPluginImport.configs.typescript.rules,
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  eslintConfigPrettier,
]
