const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path');

module.exports = {
  mode:'development',
  entry: {
    main:'./src/main.js',
  },
  plugins:[
      new HtmlWebpackPlugin({
          template: path.resolve(__dirname, './src/index.html'),
          minify: true
      })
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  }, 
  module:{
      rules:[
          {test: /\.(html)$/},
          {
              test: /\.js$/,
              exclude: /node_modules/
          },
      ]
  }
};