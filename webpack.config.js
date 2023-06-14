const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
module.exports = {
  mode: 'none',
  entry: {
    index: './src/index.js',
    'index.min': './src/index.js',
    completeTable: './packages/completeTable/main.js',
    'completeTable.min': './packages/completeTable/main.js',
    setupTable: './packages/setupTable/main.js',
    'setupTable.min': './packages/setupTable/main.js',
    baseRenderForm: './packages/baseRenderForm/main.js',
    'baseRenderForm.min': './packages/baseRenderForm/main.js',
    baseRenderTable: './packages/baseRenderTable/main.js',
    'baseRenderTable.min': './packages/baseRenderTable/main.js',
    baseRenderRegular: './packages/baseRenderRegular/main.js',
    'baseRenderRegular.min': './packages/baseRenderRegular/main.js',
  },
  output: {
    path: path.join(__dirname, '/lib'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: '[name]',
    libraryExport: 'default',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.vue'],
  },
  // optimization: {
  //   minimize: true,
  //   minimizer: [
  //     new TerserPlugin({
  //       test: /\.min\.js$/,
  //       terserOptions: {
  //         compress: {
  //           drop_console: true, // 去除 console
  //           drop_debugger: true,
  //           pure_funcs: ['console.log'], // 移除console
  //         },
  //       },
  //     }),
  //   ],
  // },
  module: {
    rules: [
      {
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['lodash'],
            presets: ['@babel/preset-env'],
          },
        },
        test: /\.js$/,
        exclude: /node_modules/,
      },
      {
        test: /.(jpg|png)$/,
        use: 'file-loader',
      },
      {
        test: /\.vue$/,
        use: ['vue-loader'],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.less$/i, //使用正则表达式匹配less
        use: [
          'style-loader',
          'css-loader',
          'less-loader', //这个是导入顺序的第一个
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
    ],
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new VueLoaderPlugin(),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'lib-style/[name].css',
    }),
    new LodashModuleReplacementPlugin({ shorthands: true }),
  ],
};
