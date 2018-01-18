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
                console.log(res);

                wx.setStorageSync('userInfo', res.userInfo);//存储userInfo  
              }
            });
            wx.request({
              url: `${config.service.host}/weapp/storage/login`,
              data: { 'js_code': res.code},
              method: 'get', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
              header: { 'content-type': 'application/json' }, // 设置请求的 header 
              success: function (res) {
                console.log(res);
                wx.setStorageSync('loginInfo', res.data[0]);//存储openid和sessionkey
                wx.setStorageSync('tenantList', res.data[1]);//存储租户列表
                wx.setStorageSync('tenantStyle', res.data[2]);//存储租户属性
                wx.setStorageSync('permission', res.data[3]);//存储租户属性
              }
            });
          } else {
            console.log('获取用户登录态失败！' + res.errMsg)
          }
        }
      });
  },
})