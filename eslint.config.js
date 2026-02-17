import pluginJs from '@eslint/js'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  { files: ['**/*.{js,mjs,cjs,ts,vue}'] },
  { ignores: ['dist/**', 'node_modules/**', '**/*.d.ts', '**/generated/**'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    plugins: {
      'unused-imports': unusedImports,
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  eslintPluginPrettier,
  {
    rules: {
      // Vue-spezifische Regeln
      'vue/multi-word-component-names': 'off',
      'vue/attribute-hyphenation': 'off', // Deaktiviert die Regel für Attribut-Hyphenation
      'vue/component-name-in-template-casing': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/no-v-html': 'warn', // Warnung für v-html (Sicherheitsrisiko)
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn',

      // TypeScript-Regeln
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off', // Deaktiviert, da unused-imports verwendet wird
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',

      // Allgemeine JavaScript/ES6-Regeln
      'no-console': 'warn', // Warnung statt Fehler für console.log
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-unused-vars': 'off', // Deaktiviert, da unused-imports verwendet wird
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',

      // Code-Qualität
      'padding-line-between-statements': 'off',
      'no-duplicate-imports': 'error',
      'no-useless-return': 'warn',
      'no-useless-concat': 'warn',
      'prefer-destructuring': 'off', // Kann zu viel sein

      // Unused Imports/Vars
      'unused-imports/no-unused-imports': 'error', // Entfernt ungenutzte Importe
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all', // Überprüft alle Variablen
          varsIgnorePattern: '^_', // Ignoriert Variablen, die mit `_` beginnen
          args: 'after-used', // Überprüft nur nicht verwendete Argumente nach der letzten Nutzung
          argsIgnorePattern: '^_', // Ignoriert Argumente, die mit `_` beginnen
        },
      ],
    },
  },
  // Spezielle Regeln für TypeScript-Dateien
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  // Spezielle Regeln für Vue-Dateien
  {
    files: ['**/*.vue'],
    rules: {
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
      'vue/component-tags-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
    },
  },
]
