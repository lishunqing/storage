//app.js
//var qcloud = require('./vendor/wafer2-client-sdk/index')
var config = require('./config')

App({
    onLaunch: function () {
    var that = this
      wx.login({
        success: function (res) {
          if (res.code) {
            wx.getUserInfo({
              success: function (res) {
                var objz = {};
                wx.setStorageSync('userInfo', res.userInfo);//存储userInfo  
              }
            });
            wx.request({
              url: `${config.service.host}/weapp/storage/login`,
              data: { 'js_code': res.code},
              method: 'get', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
              header: { 'content-type': 'application/json' }, // 设置请求的 header 
              success: function (res) {
                var objz = {};
                wx.setStorageSync('loginInfo', res.data);//存储openid和sessionkey
              }
            });
          } else {
            console.log('获取用户登录态失败！' + res.errMsg)
          }
        }
      });
  },
})