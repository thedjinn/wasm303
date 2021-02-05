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
        "plugin:react/recommended"
    ],
    rules: {
    }
};
