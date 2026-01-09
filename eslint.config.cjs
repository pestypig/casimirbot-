const tsParser = require("@typescript-eslint/parser");

const SOURCES = [
  "client/src/**/*.{js,jsx,ts,tsx}",
  "server/**/*.{js,jsx,ts,tsx}",
  "shared/**/*.{js,jsx,ts,tsx}",
  "scripts/**/*.{js,jsx,ts,tsx}",
  "tests/**/*.{js,jsx,ts,tsx}",
  "tools/**/*.{js,jsx,ts,tsx}",
  "cli/**/*.{js,jsx,ts,tsx}",
  "sdk/**/*.{js,jsx,ts,tsx}",
  "modules/**/*.{js,jsx,ts,tsx}",
];

const IGNORES = [
  "**/.cal/**",
  "**/.git/**",
  "**/.next/**",
  "**/build/**",
  "**/coverage/**",
  "**/dist/**",
  "**/external/**",
  "**/node_modules/**",
  "**/out/**",
  "**/public/**",
  "**/reports/**",
  "**/server/_generated/**",
  "**/tmp/**",
  "**/temp/**",
];

module.exports = [
  {
    files: SOURCES,
    ignores: IGNORES,
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      ecmaVersion: "latest",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {},
  },
];
