const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/CreateScene.ts',
    output: {
        filename: 'create-bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            test: /\.ts$/,
            use: "ts-loader"
        }]
    },
    resolve: {
        extensions: [
            '.ts'
        ]
    },
    devtool: "eval-source-map"
};
