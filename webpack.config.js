'use strict';

const {resolve} = require('path')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const watch = process.env.WEBPACK_WATCH === 'true'

const distPath = resolve(__dirname, 'dist')

const base = {
  mode,
  watch,
  output: {
    path: distPath,
    chunkFilename: '[name].chunk.js',
    filename: '[name].js'
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)$/i,
        type: 'asset/resource'
      }
    ]
  },
  externals: {
    'system': '{}', // jsonlint
    'file': '{}' // jsonlint
  },
}

const renderPlugins = [
  new HtmlWebpackPlugin({title: 'Medis', chunks: ['main'], filename: 'main.html'}),
  new HtmlWebpackPlugin({title: 'Manage Patterns', chunks: ['patternManager'], filename: 'patternManager.html'}),
  new MiniCssExtractPlugin({filename: '[name].css'}),
  new webpack.ProvidePlugin({React: 'react'}),
]
if (mode === 'production' && process.env.ANALYZE === 'true') {
  renderPlugins.push(new BundleAnalyzerPlugin())
}
const renderer = Object.assign({}, base, {
  target: 'electron-renderer',
  output: Object.assign({}, base.output, {
    path: resolve(base.output.path, 'renderer')
  }),
  entry: {
    main: resolve(__dirname, 'src/renderer/windows/MainWindow/entry.jsx'),
    patternManager: resolve(__dirname, 'src/renderer/windows/PatternManagerWindow/entry.jsx')
  },
  plugins: renderPlugins,
  resolve: {
    alias: {
      Redux: resolve(__dirname, 'src/renderer/redux/'),
      Utils: resolve(__dirname, 'src/renderer/utils/'),
      electron: resolve(__dirname, 'src/renderer/electron-shim.js'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
})

const main = Object.assign({}, base, {
  target: 'electron-main',
  output: Object.assign({}, base.output, {
    path: resolve(base.output.path, 'main')
  }),
  entry: {
    index: resolve(__dirname, 'src/main/index.ts')
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
})

module.exports = [main, renderer]
