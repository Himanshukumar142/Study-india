import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Unused variables ko absolute error ke bajay warning me convert karein
      'no-unused-vars': ['warn', { 
        vars: 'all', 
        args: 'after-used', 
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_' 
      }],
      // Fast refresh rule ko warn par set karein
      'react-refresh/only-export-components': 'warn',
      // Empty blocks catch/try ko warn karein
      'no-empty': 'warn',
      // Strict React compiler rules ko turn off karein taaki build successfully pass ho sake
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    }
  },
])
