// vim:ft=javascript

module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        project: './tsconfig.json',
        //sourceType: "module"
    },
    extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended"
    ],
    rules: {
        "@typescript-eslint/no-namespace": ["error", {allowDeclarations: true}],
        "@typescript-eslint/no-unused-vars": ["error", {args: "none"}]
    },
    settings: {
        react: {
            version: "detect"
        }
    }
};
