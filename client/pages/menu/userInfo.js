var config = require('../../config')
var util = require('../../util')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    name:"",
    remark:"",
    auth:"",
    openid:"",
    userid:undefined,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var loginInfo = wx.getStorageSync('loginInfo');
    if (loginInfo){
      this.setData({
        name: loginInfo.username ? loginInfo.username:'',
        remark: loginInfo.userremark ? loginInfo.userremark:'',
        disabled: loginInfo.disabled != false ?true:false,
      });
    }
  },
  nameInput: function (e) {
    var that = this;
    that.setData({
      name: e.detail.value,
    })
  },
  remarkInput: function (e) {
    var that = this;
    that.setData({
      remark: e.detail.value,
    })
  },
  authInput: function (e) {
    var that = this;
    that.setData({
      auth: e.detail.value,
    })
  },
  save: function (e) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    if ((that.data.name == undefined) || (that.data.name == "")) {
      wx.showModal({
        title: '错误',
        content: '称呼不能为空',
        showCancel: false,
      })
      return;
    }

    wx.showModal({
      title: '提示',
      content: `确认保存用户信息`,
      success: function (sm) {
        if (sm.confirm) {
          util.showBusy();
          wx.request({
            url: `${config.service.host}/weapp/storage/saveUser`,
            data: [loginInfo,{
              openid: loginInfo.openid,
              username: that.data.name,
              userremark: that.data.remark,
            }, { auth: that.data.auth,},],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              util.showSuccess('保存成功!');
              query();
            },
            fail: function (err) {
              util.showModel('网络异常', err);
            }
          })
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      },
      fail: function (err) {}
    });
  },
  query: function(e){
    wx.login({
      success: function (res) {
        if (res.code) {
          wx.getUserInfo({
            success: function (res) {
              wx.setStorageSync('userInfo', res.userInfo);//存储userInfo  
            }
          });
          util.showBusy();
          wx.request({
            url: `${config.service.host}/weapp/storage/login`,
            data: { 'js_code': res.code },
            method: 'get', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
            header: { 'content-type': 'application/json' }, // 设置请求的 header 
            success: function (res) {
              util.stopBusy();
              wx.setStorageSync('loginInfo', res.data[0]);//存储openid和sessionkey
              wx.setStorageSync('tenantList', res.data[1]);//存储租户列表
              wx.setStorageSync('tenantStyle', res.data[2]);//存储租户属性
              wx.setStorageSync('permission', res.data[3]);//存储租户属性
              if (res.data[0].disabled == 0){
                wx.redirectTo({
                  url: "/pages/menu/menu",
                });
              }
            },
            fail: function (err) {
              util.showModel('网络异常', err);
            }
          });
        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });
  },
})