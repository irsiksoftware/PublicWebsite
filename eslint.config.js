export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                console: "readonly",
                document: "readonly",
                window: "readonly",
                localStorage: "readonly",
                fetch: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                clearTimeout: "readonly",
                location: "readonly",
                MutationObserver: "readonly",
                IntersectionObserver: "readonly",
                CustomEvent: "readonly",
                Chart: "readonly",
                TETROMINO_SHAPES: "readonly",
                SessionDetailModal: "readonly",
                module: "readonly",
                navigator: "readonly",
                self: "readonly"
            }
        },
        rules: {
            "semi": ["error", "always"],
            "quotes": ["error", "single"],
            "indent": ["error", 4],
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];
