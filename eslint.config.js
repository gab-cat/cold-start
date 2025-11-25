// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  // Add rules for spacing for tsx and ts files
  {
    rules: {
      "react/jsx-indent": "error",
      "react/jsx-indent-props": "error",
    },
  },
  {
    ignores: ["dist/*"],
  },
]);
