import pluginJs from '@eslint/js'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  { files: ['**/*.{js,mjs,cjs,ts,vue}'] },
  { ignores: ['dist/**', 'node_modules/**', '**/*.d.ts', '**/generated/**', 'src/api/**'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    ...pluginJs.configs.recommended,
    rules: {
      ...pluginJs.configs.recommended.rules,
      'no-useless-assignment': 'off', // Deaktiviert, da viele False Positives
    },
  },
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
    },
  },
  // Deaktivierung von no-useless-assignment nach allen empfohlenen Konfigurationen
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    rules: {
      'no-useless-assignment': 'off', // Deaktiviert global, da viele False Positives (z.B. Variablen die später zugewiesen werden)
    },
  },
  // Spezielle Regeln für TypeScript-Dateien
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          caughtErrors: 'all',
          ignoreRestSiblings: false,
          ignoreUsingDeclarations: false,
          reportUsedIgnorePattern: false,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off', // TypeScript-Regel wird verwendet
    },
  },
  // Spezielle Regeln für JavaScript-Dateien
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off', // TypeScript-Regeln nicht für JS-Dateien
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          caughtErrors: 'all',
          ignoreRestSiblings: false,
          ignoreUsingDeclarations: false,
          reportUsedIgnorePattern: false,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-useless-assignment': 'off', // Deaktiviert für Mock-Dateien und ähnliche Fälle
    },
  },
  // Spezielle Regeln für Mock-Dateien
  {
    files: ['mock-api.js', '**/mock*.js', '**/*mock*.js'],
    rules: {
      'no-useless-assignment': 'off', // Mock-Dateien haben oft Initialisierungen die später verwendet werden
    },
  },
  // Spezielle Regeln für Vue-Dateien
  {
    files: ['**/*.vue'],
    rules: {
      'no-useless-assignment': 'off', // Deaktiviert, da Template-Verwendung nicht erkannt wird
      'vue/block-order': [
        'error',
        {
          order: ['script', 'template', 'style'],
        },
      ],
    },
  },
  // Spezielle Regeln für generierte API-Dateien (Orval)
  {
    files: ['src/api/**/*.ts'],
    rules: {
      'no-duplicate-imports': 'off', // Orval generiert mehrere Imports vom selben Modul
    },
  },
  // Explizite Deaktivierung von no-useless-assignment für alle Dateien (muss am Ende stehen)
  {
    files: ['**/*'],
    rules: {
      'no-useless-assignment': 'off',
    },
  },
]
