import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";

export default [
  // Ignorar diretórios gerados e configs
  { ignores: ["**/dist/**","**/build/**","**/coverage/**","**/node_modules/**","**/eslint.config.*"] },

  // Regras base JS
  js.configs.recommended,

  // TypeScript (sem type-aware por enquanto)
  ...tseslint.configs.recommended,

  // TS/TSX em packages/**/src
  {
    files: ["packages/**/src/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y, import: importPlugin },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "import/no-unresolved": "off"
    },
    settings: { react: { version: "detect" } }
  },

  // JS/JSX em packages/**/src
  {
    files: ["packages/**/src/**/*.{js,jsx}"],
    plugins: { import: importPlugin }
  }
];
