import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                process: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                URL: "readonly",
                fetch: "readonly",
                AbortSignal: "readonly",
                Buffer: "readonly",
                __dirname: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "error",
            "no-undef": "error"
        }
    }
];
