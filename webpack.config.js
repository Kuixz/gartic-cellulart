const path = require('path')
const CopyPlugin = require("copy-webpack-plugin");
// const { EvalDevToolModulePlugin } = require('webpack');
// const HTMLWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    mode: 'development',

    entry: {
        // injector: path.resolve(__dirname, 'src/branches/injector.js'),
        cellulart: path.resolve(__dirname, 'src/content/cellulart.js'),
        popup: path.resolve(__dirname, 'src/popup/popup.js'),
        // manifest: path.resolve(__dirname, 'manifest.json')
        // worker: path.resolve(__dirname, 'src/branches/worker.js'),
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',

        assetModuleFilename: (pathData) => {
            const filepath = path
            .dirname(pathData.filename)
            .split("/")
            .slice(1)
            .join("/");
            return `${filepath}/[name].[hash][ext][query]`;
        },
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader' ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            }
            // {
            //     test: /manifest.json$/,
            //     use: [
            //         {
            //             loader: path.resolve(__dirname, 'test/setup/manifest_chrome_loader.js'),
            //             options: {
            //                 /* ... */
            //             },
            //         }
            //     ]
            // },
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                // { from: "src/content/cellulart.js", to: "injected" },
                // { from: "src/branches/injected", to: "injected" },
                { from: "src/branches/injected.js", to: "injected.js" },
                { from: "src/branches/injector.js", to: "injector.js" },
                { from: "src/branches/worker.js", to: "worker.js"},
                // { from: "src/icons", to: "icons" },
                // { from: "other", to: "public" },
            ],
        }),
        // new HTMLWebpackPlugin({
        //     filename: "popup.html",
        //     template: "src/popup/popup.html"
        // })
    ]
}