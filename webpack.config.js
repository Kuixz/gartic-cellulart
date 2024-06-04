const path = require('path')
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'development',
    entry: {
        // injector: path.resolve(__dirname, 'src/branches/injector.js'),
        cellulart: path.resolve(__dirname, 'src/content/cellulart.js'),
        // worker: path.resolve(__dirname, 'src/branches/worker.js'),
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            // {
            //     test: /\.scss$/,
            //     use: ['style-loader', 'css-loader', 'sass-loader' ]
            // },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ]
    },
    plugins: [
        // new CopyPlugin({
        //     patterns: [
        //             { from: "src/branches/injected", to: "injected" },
        //             { from: "src/branches/worker.js", to: "worker.js"}
        //             // { from: "other", to: "public" },
        //         ],
        //     }),
    ]
}