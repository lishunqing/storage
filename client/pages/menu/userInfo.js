var config = require('../../config')
// pages/menu/userInfo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name:"",
    remark:"",
    openid:"",
    userid:undefined,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var loginInfo = wx.getStorageSync('loginInfo');
    this.setData({
      openid:loginInfo.openid,
      userid:loginInfo.userid,
      name:loginInfo.username,
      remark:loginInfo.userremark,
      disabled:loginInfo.disabled,
    });
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
  save: function (e) {
    var that = this;
    wx.showModal({
      title: '提示',
      content: `确认保存用户信息`,
      success: function (sm) {
        if (sm.confirm) {
          wx.request({
            url: `${config.service.host}/weapp/storage/saveUser`,
            data: [{
              userid: that.data.userid,
              openid: that.data.openid,
              username: that.data.name,
              userremark: that.data.remark,
            }],
            method: 'POST',
            header: { 'content-type': 'application/json' },
            success: function (result) {
              that.setData({
                userid: result.data.userid,
              });
              var loginInfo = wx.getStorageSync('loginInfo');
              loginInfo.userid = that.data.userid;
              loginInfo.username = that.data.name;
              loginInfo.userremark = that.data.remark;
              wx.setStorageSync('loginInfo', loginInfo);
              wx.showToast({
                title: '保存成功!',
                icon: 'success'
              })
            },
            fail: function (err) {
              console.log(err);
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
              console.log(res);

              wx.setStorageSync('userInfo', res.userInfo);//存储userInfo  
            }
          });
          wx.request({
            url: `${config.service.host}/weapp/storage/login`,
            data: { 'js_code': res.code },
            method: 'get', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
            header: { 'content-type': 'application/json' }, // 设置请求的 header 
            success: function (res) {
              console.log(res);
              wx.setStorageSync('loginInfo', res.data[0]);//存储openid和sessionkey
              wx.setStorageSync('tenantList', res.data[1]);//存储租户列表
              wx.setStorageSync('tenantStyle', res.data[2]);//存储租户属性
              wx.setStorageSync('permission', res.data[3]);//存储租户属性
              if (res.data[0].disabled == 0){
                wx.redirectTo({
                  url: "/pages/menu/menu",
                });
              }
            }
          });
        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });
  },
})