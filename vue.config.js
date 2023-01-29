module.exports = {
  publicPath: './',
  productionSourceMap: false,
  lintOnSave: true,
  devServer: {
    host: '127.0.0.1',
    port: 8430, // 端口
    disableHostCheck: true,
    https: false,
    proxy: {
      [process.env.VUE_APP_API]: {
        target: process.env.VUE_APP_HOST,
        changeOrigin: true, // 是否跨域
        secure: true, // 如果是https接口，需要配置这个参数
        ws: true, // // 是否启用websockets
        pathRewrite: {
          '^/commondp': '/commondp'
        }
      }
    }
  }
}

