import js from '@eslint/js'
import eslintReact from '@eslint-react/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Ported from the eslintrc `react-app` preset (eslint-config-react-app), which is stuck on ESLint 8
// and @typescript-eslint 5. The rules below are that preset's, minus the Flow, AMD, webpack,
// prop-types and class-component rules that cannot fire here, and the React rules TypeScript
// already enforces (jsx-no-undef, jsx-no-duplicate-props, style-prop-object, no-typos).

// From `confusing-browser-globals`: bare references that are almost always a missing local.
// prettier-ignore
const confusingBrowserGlobals = [
  'addEventListener', 'blur', 'close', 'closed', 'confirm', 'defaultStatus', 'defaultstatus',
  'event', 'external', 'find', 'focus', 'frameElement', 'frames', 'history', 'innerHeight',
  'innerWidth', 'length', 'location', 'locationbar', 'menubar', 'moveBy', 'moveTo', 'name',
  'onblur', 'onerror', 'onfocus', 'onload', 'onresize', 'onunload', 'open', 'opener', 'opera',
  'outerHeight', 'outerWidth', 'pageXOffset', 'pageYOffset', 'parent', 'print',
  'removeEventListener', 'resizeBy', 'resizeTo', 'screen', 'screenLeft', 'screenTop', 'screenX',
  'screenY', 'scroll', 'scrollbars', 'scrollBy', 'scrollTo', 'scrollX', 'scrollY', 'self',
  'status', 'statusbar', 'stop', 'toolbar', 'top',
]

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'workbenches/*/public',
    'playwright-report',
    'test-results',
    'e2e',
    '*.config.{js,ts}',
  ]),

  js.configs.recommended,
  {
    languageOptions: { globals: globals.browser },
    rules: {
      'array-callback-return': 'warn',
      eqeqeq: ['warn', 'smart'],
      'no-caller': 'warn',
      'no-eval': 'warn',
      'no-extend-native': 'warn',
      'no-extra-bind': 'warn',
      'no-extra-label': 'warn',
      'no-implied-eval': 'warn',
      'no-iterator': 'warn',
      'no-label-var': 'warn',
      'no-labels': ['warn', { allowLoop: true, allowSwitch: false }],
      'no-lone-blocks': 'warn',
      'no-loop-func': 'warn',
      'no-multi-str': 'warn',
      'no-new-func': 'warn',
      'no-new-wrappers': 'warn',
      'no-object-constructor': 'warn',
      'no-octal-escape': 'warn',
      'no-restricted-globals': ['error', ...confusingBrowserGlobals],
      'no-script-url': 'warn',
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-template-curly-in-string': 'warn',
      'no-throw-literal': 'warn',
      'no-useless-computed-key': 'warn',
      'no-useless-concat': 'warn',
      'no-useless-rename': 'warn',
      'unicode-bom': ['warn', 'never'],
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.eslintRecommended],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'warn',
      '@typescript-eslint/no-array-constructor': 'warn',
      '@typescript-eslint/no-redeclare': 'warn',
      '@typescript-eslint/no-use-before-define': [
        'warn',
        { functions: false, classes: false, variables: false, typedefs: false },
      ],
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-redux',
              importNames: ['useSelector', 'useStore', 'useDispatch'],
              message: 'Please use pre-typed versions from `src/app/hooks.ts` instead.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@eslint-react': eslintReact,
      'react-hooks': reactHooks,
      'jsx-a11y-x': jsxA11y,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      '@eslint-react/jsx-no-comment-textnodes': 'warn',
      '@eslint-react/dom-no-unsafe-target-blank': 'warn',
      '@eslint-react/dom-no-dangerously-set-innerhtml-with-children': 'warn',

      'jsx-a11y-x/alt-text': 'warn',
      'jsx-a11y-x/anchor-has-content': 'warn',
      'jsx-a11y-x/anchor-is-valid': ['warn', { aspects: ['noHref', 'invalidHref'] }],
      'jsx-a11y-x/aria-activedescendant-has-tabindex': 'warn',
      'jsx-a11y-x/aria-props': 'warn',
      'jsx-a11y-x/aria-proptypes': 'warn',
      'jsx-a11y-x/aria-role': ['warn', { ignoreNonDOM: true }],
      'jsx-a11y-x/aria-unsupported-elements': 'warn',
      'jsx-a11y-x/heading-has-content': 'warn',
      'jsx-a11y-x/iframe-has-title': 'warn',
      'jsx-a11y-x/img-redundant-alt': 'warn',
      'jsx-a11y-x/no-access-key': 'warn',
      'jsx-a11y-x/no-distracting-elements': 'warn',
      'jsx-a11y-x/no-redundant-roles': 'warn',
      'jsx-a11y-x/role-has-required-aria-props': 'warn',
      'jsx-a11y-x/role-supports-aria-props': 'warn',
      'jsx-a11y-x/scope': 'warn',
    },
  },

  prettier,
])
