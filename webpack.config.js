const path = require("path");
const webpack = require("webpack");

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

const CopyWebpackPlugin = require("copy-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    mode: "development",

    entry: {
        bootstrap: "./src/bootstrap.ts",
        worklet2: "./src/worklet2.ts"
    },

    output: {
        publicPath: "/",
        globalObject: "globalThis"
    },

    plugins: [
        new webpack.ProgressPlugin(),
        new ESLintPlugin({
            extensions: ["ts", "tsx", "js", "jsx"]
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "public",
                    to: ""
                }
            ]
        })
    ],

    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: "ts-loader",
                include: [path.resolve(__dirname, "src")],
                exclude: [/node_modules/]
            },
            {
                test: /.(scss|css)$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            }
        ]
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },

    optimization: {
        minimizer: [new TerserPlugin()],

        splitChunks: {
            cacheGroups: {
                vendors: {
                    priority: -10,
                    test: /[\\/]node_modules[\\/]/
                }
            },

            chunks: "async",
            minChunks: 1,
            minSize: 30000,
            name: false
        }
    },

    experiments: {
        asyncWebAssembly: true
        //syncWebAssembly: true
    },

    devServer: {
        hot: false,
        inline: false,
        liveReload: false
    }
};
