const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackBar = require('webpackbar')
const CopyPlugin = require('copy-webpack-plugin')

// css/css module 正则表达式
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
// sass/sass module 正则表达式
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
// less/less module 正则表达式
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;
// stylus/stylus module 正则表达式
const stylRegex = /\.styl$/;
const stylModuleRegex = /\.module\.styl$/;

console.log('process.env.NODE_ENV', process.env.NODE_ENV)
module.exports = () => {
  return {
    mode: "development",
    entry: {
      index: './src/index.tsx'
    },
    target: 'web',
    output: {
      // 打包文件根目录
      publicPath: process.env.NODE_ENV == 'development' ? '/' : '/ai',
      path: path.resolve(__dirname, "dist/"),
    },
    plugins: [
      // 生成 index.html
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./build/index.html",
      }),
      new WebpackBar(),
      new CopyPlugin({
        patterns: [
          { from: './build/*.tflite', to: '[name].tflite' },
          { from: './build/*.task', to: '[name].task' },
          // { from: './build/*.bin', to: '[name].bin' },
          { from: './build/*.jpg', to: '[name].jpg' },
          {from: './build/*.js', to: '[name].js'},
          { from: './node_modules/@mediapipe/tasks-vision/wasm/*', to: 'wasm/[name][ext]' },
          { from: './node_modules/@mediapipe/tasks-text/wasm/*', to: 'wasm/[name][ext]' },
          { from: './node_modules/@mediapipe/tasks-genai/wasm/*', to: 'wasm/[name][ext]' },
        ],
      }),
    ],
    resolve: {
      extensions: ['.tsx', '.jsx', '.ts', '.js', '.json', '.wasm']
    },
    module: {
      rules: [
        {
          test: /\.(jsx|js|ts|tsx)?$/,
          use: ["thread-loader", "swc-loader"],
          include: path.resolve(__dirname, 'src'),
        },
        {
          test: cssRegex,
          exclude: cssModuleRegex,
          use: ["style-loader", "css-loader", "postcss-loader"]
        },
        {
          test: cssModuleRegex,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true
              }
            },
            "postcss-loader"
          ]
        },
        {
          test: sassRegex,
          exclude: sassModuleRegex,
          use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"]
        },
        {
          test: sassModuleRegex,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true
              }
            },
            "postcss-loader",
            "sass-loader"
          ]
        },
        {
          test: stylRegex,
          exclude: stylModuleRegex,
          use: ["style-loader", "css-loader", "postcss-loader", "stylus-loader"]
        },
        {
          test: stylModuleRegex,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true
              }
            },
            "postcss-loader",
            "stylus-loader"
          ]
        },
        {
          test: lessRegex,
          exclude: lessModuleRegex,
          use: ["style-loader", "css-loader", "postcss-loader", "less-loader"],
          sideEffects: true,
        },
        {
          test: lessModuleRegex,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true
              }
            },
            "postcss-loader",
            "less-loader"
          ],
        },
        {
          test: /\.(jpe?g|png|gif|svg|woff|woff2|eot|ttf|otf)$/i,
          type: "asset/resource",
        },
      ]
    },
  }
}