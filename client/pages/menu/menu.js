// menu.js
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
    var loginInfo = wx.getStorageSync('loginInfo');
    if (loginInfo.disabled != 0){
      wx.redirectTo({
        url: "/pages/menu/userInfo",
      });
    }
    var per = wx.getStorageSync('permission');
    var m = [];
    for(var x in per){
      m[per[x].privilegeid] = true;
    }
    that.setData({ permissions: m});
  },

  importList: function(e){
    wx.navigateTo({
      url: "/pages/dispatch/importList",
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