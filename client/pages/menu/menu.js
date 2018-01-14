// menu.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
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
})