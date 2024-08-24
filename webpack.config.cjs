// const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const HtmlWebpackPlugin = require('html-webpack-plugin');
// const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default;
const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = (env) => {
    if (!(["chrome","firefox"].includes(env.manifest))) { 
        throw new Error(`Invalid manifest reference: "${env.manifest})"`)
    }
    return {
        mode: 'development',
        target: 'web',
        entry: {
            content: './src/content/cellulart.ts',
            background: './src/background/index.ts',
            popup: './src/popup/popup.js'
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: '[name].js',
            clean: true
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"]
        },
        plugins: [
            // new MiniCssExtractPlugin({
            //     filename: "[name].css",
            //     // chunkFilename: "[id].css"
            // }),
            new HtmlWebpackPlugin({
                // template: './src/index.html',
                // chunks: ['popup'],
                // filename: 'index.html'
                // template: './src/popup/popup.html',
                // chunks: ['popup'],
                // filename: 'popup.html'
            }),
            new CopyPlugin({
                patterns: [{
                    from: path.resolve(`manifest-${env.manifest}.json`),
                    to: path.resolve('dist')
                },{
                    from: path.resolve('icons'),
                    to: path.resolve('dist')
                },{
                    from: path.resolve('src/content/content.css'),
                    to: path.resolve('dist')
                },{
                    from: path.resolve('src/popup'),
                    to: path.resolve('dist/popup'),
                },{
                //     from: path.resolve('src/popup/popup-bg.png'),
                //     to: path.resolve('dist'),
                // },{
                //     from: path.resolve('src/popup/popup.css'),
                //     to: path.resolve('dist')
                // },{
                    from: path.resolve('src/assets'),
                    to: path.resolve('dist/assets')
                }]
            }),
            // new HTMLInlineCSSWebpackPlugin()
        ],
        devtool: false,
        module: {
            rules: [
                // {
                //   test: /\.css$/i,
                //   use: [
                //     // MiniCssExtractPlugin.loader,
                //     "style-loader", 
                //     // "css-loader"],
                //     "css-loader"]
                // },
                {
                    test: /.(ts|tsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                // ['@babel/preset-react', {'runtime': 'automatic'}],
                                '@babel/preset-typescript'
                            ]
                        }
                    }
                },
                // {
                //   test: /\.(png|jpe?g|gif|jp2|webp)$/,
                //   type: 'asset/resource'
                // },
            ]
        }
    }
}
