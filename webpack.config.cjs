const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      main: './js/main.js',
      'agent-metrics-table': './js/agent-metrics-table.js',
      'agent-profile': './js/agent-profile.js',
      'agent-selector': './js/agent-selector.js',
      'analytics-events': './js/analytics-events.js',
      'audit-sessions': './js/audit-sessions.js',
      'back-to-top': './js/back-to-top.js',
      'cache-performance-chart': './js/cache-performance-chart.js',
      'charts': './js/charts.js',
      'data-loader': './js/data-loader.js',
      'data-refresh': './js/data-refresh.js',
      'hero-carousel': './js/hero-carousel.js',
      'lazy-load-images': './js/lazy-load-images.js',
      'mobile-nav': './js/mobile-nav.js',
      'roles-overview': './js/roles-overview.js',
      'service-worker-register': './js/service-worker-register.js',
      'session-detail-modal': './js/session-detail-modal.js',
      'session-timeline': './js/session-timeline.js',
      'spy-activity': './js/spy-activity.js',
      'sticky-header': './js/sticky-header.js',
      'success-rate-chart': './js/success-rate-chart.js',
      'table-keyboard-navigation': './js/table-keyboard-navigation.js',
      'tetris': './js/tetris.js',
      'tetromino-shapes': './js/tetromino-shapes.js',
      'theme-toggle': './js/theme-toggle.js',
      'token-usage-chart': './js/token-usage-chart.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
      chunkFilename: isProduction ? 'js/[name].[contenthash].chunk.js' : 'js/[name].chunk.js',
      clean: true,
      publicPath: '/'
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              cacheDirectory: true
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        filename: 'index.html',
        chunks: ['main', 'mobile-nav', 'theme-toggle', 'hero-carousel', 'analytics-events']
      }),
      new HtmlWebpackPlugin({
        template: './contact.html',
        filename: 'contact.html',
        chunks: ['main', 'mobile-nav', 'theme-toggle', 'analytics-events']
      }),
      new HtmlWebpackPlugin({
        template: './offline.html',
        filename: 'offline.html',
        chunks: ['main']
      }),
      new HtmlWebpackPlugin({
        template: './privacy-policy.html',
        filename: 'privacy-policy.html',
        chunks: ['main', 'mobile-nav', 'theme-toggle', 'analytics-events']
      }),
      new HtmlWebpackPlugin({
        template: './session-timeline.html',
        filename: 'session-timeline.html',
        chunks: ['main', 'mobile-nav', 'theme-toggle', 'session-timeline', 'analytics-events']
      }),
      new HtmlWebpackPlugin({
        template: './terms-of-service.html',
        filename: 'terms-of-service.html',
        chunks: ['main', 'mobile-nav', 'theme-toggle', 'analytics-events']
      }),
      new HtmlWebpackPlugin({
        template: './tetris.html',
        filename: 'tetris.html',
        chunks: ['main', 'tetris', 'tetromino-shapes', 'analytics-events']
      }),
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash].css',
          chunkFilename: 'css/[name].[contenthash].chunk.css'
        })
      ] : [])
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            }
          }
        }),
        new CssMinimizerPlugin()
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      },
      runtimeChunk: {
        name: 'runtime'
      }
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  };
};
