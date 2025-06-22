module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "max-len": ["error", { "code": 120 }], // Increase from 80 to 120
    "require-jsdoc": 0, // Disable JSDoc requirement
    "@typescript-eslint/no-explicit-any": "warn", // Change to warning
    "@typescript-eslint/no-unused-vars": "warn", // Change to warning
    "no-trailing-spaces": "error",
    "comma-dangle": ["error", "always-multiline"],
    "object-curly-spacing": ["error", "always"],
    "indent": ["error", 2],
    "arrow-parens": ["error", "always"],
  },
};