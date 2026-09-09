'use strict';

const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

module.exports = {
  mode,
  target: 'web',
  entry: {
    main: resolve(__dirname, 'src/renderer/windows/MainWindow/entry.jsx'),
    patternManager: resolve(__dirname, 'src/renderer/windows/PatternManagerWindow/entry.jsx'),
  },
  output: {
    path: resolve(__dirname, 'dist/renderer'),
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: { transpileOnly: true },
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Medis',
      chunks: ['main'],
      filename: 'main.html',
    }),
    new HtmlWebpackPlugin({
      title: 'Manage Patterns',
      chunks: ['patternManager'],
      filename: 'patternManager.html',
    }),
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new webpack.ProvidePlugin({
      React: 'react',
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
  ],
  resolve: {
    alias: {
      Redux: resolve(__dirname, 'src/renderer/redux/'),
      Utils: resolve(__dirname, 'src/renderer/utils'),
      electron: resolve(__dirname, 'src/renderer/electron-shim.js'),
      '@electron/remote': resolve(__dirname, 'src/renderer/electron-shim.js'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'),
      events: require.resolve('events/'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      stream: false,
      net: false,
      tls: false,
      fs: false,
      path: false,
      child_process: false,
    },
  },
  externals: {
    system: '{}',
    file: '{}',
  },
};
