const path = require('path')

module.exports = {
    mode: 'development',
    entry: {
        injector: path.resolve(__dirname, 'src/branches/injector.js'),
        cellulart: path.resolve(__dirname, 'src/content/cellulart.js')
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
    }
}