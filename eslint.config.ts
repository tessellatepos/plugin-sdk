import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["lib", "node_modules"]),
    {
        files: ["**/*.{ts,mts,cts,tsx}"],
        plugins: {
            js,
            "@typescript-eslint": tseslint.plugin,
        },
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
            eslintPluginPrettierRecommended,
        ],
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
            },
            globals: globals.node,
        },
    },
]);
