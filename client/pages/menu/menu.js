// menu.js
var config = require('../../config')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    permissions:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var that = this
    wx.login({
      success: function (res) {
        if (res.code) {
          wx.getUserInfo({
            success: function (res) {
              wx.setStorageSync('userInfo', res.userInfo);//存储userInfo  
            }
          });
          wx.request({
            url: `${config.service.host}/weapp/storage/login`,
            data: { 'js_code': res.code },
            method: 'get', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
            header: { 'content-type': 'application/json' }, // 设置请求的 header 
            success: function (res) {
              wx.setStorageSync('loginInfo', res.data[0]);//存储openid和sessionkey
              wx.setStorageSync('tenantList', res.data[1]);//存储租户列表
              wx.setStorageSync('tenantStyle', res.data[2]);//存储租户属性
              wx.setStorageSync('permission', res.data[3]);//存储租户属性
              var loginInfo = res.data[0];
              if (loginInfo.disabled != 0) {
                wx.redirectTo({
                  url: "/pages/menu/userInfo",
                });
              }
              var per = wx.getStorageSync('permission');
              var m = [];
              for (var x in per) {
                m[per[x].privilegeid] = true;
              }
              that.setData({ permissions: m });
            }
          });
        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });
  },

  model: function (e) {
    wx.navigateTo({
      url: "/pages/model/maintain",
    });
  },
  importList: function(e){
    wx.navigateTo({
      url: "/pages/dispatch/importList",
    });
  },
  arriveList: function (e) {
    wx.navigateTo({
      url: "/pages/dispatch/arriveList",
    });
  },
  exportList: function (e) {
    wx.navigateTo({
      url: "/pages/dispatch/exportList",
    });
  },
  importPrint: function (e) {
    wx.navigateTo({
      url: "/pages/print/importPrint",
    });
  },
  instoreList: function (e) {
    wx.navigateTo({
      url: "/pages/store/instoreList",
    });
  },
  transferList: function (e) {
    wx.navigateTo({
      url: "/pages/store/transferList",
    });
  },
  userInfo: function (e) {
    wx.navigateTo({
      url: "/pages/menu/userInfo",
    });
  },
  userList: function (e) {
    wx.navigateTo({
      url: "/pages/menu/userList",
    });
  },
})