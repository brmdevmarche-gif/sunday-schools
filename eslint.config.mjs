import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Project-level rule tuning:
  // - This codebase contains many intentional `any` usages (Supabase responses, dynamic JSON, etc.).
  //   Keeping this as an error blocks linting entirely, so treat it as a warning.
  // - Node scripts under `scripts/` use CommonJS `require()`; allow it there.
  // - React compiler rule `set-state-in-effect` is noisy for legitimate "mounted" flags; warn only.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "react-hooks/set-state-in-effect": "warn",
      // Accessibility rules (WCAG 2.2 AA)
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-has-content": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-role": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/heading-has-content": "warn",
      "jsx-a11y/label-has-associated-control": ["warn", {
        assert: "either",
        controlComponents: ["Input", "Textarea", "Select", "Checkbox", "RadioGroup"],
      }],
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
    },
  },
  {
    files: ["scripts/**/*.{js,cjs,mjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
