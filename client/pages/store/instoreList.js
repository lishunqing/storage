var config = require('../../config')
// pages/store/instoreList.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryInstoreList`,
      data: {
        loginInfo: loginInfo,
      },
      method: 'GET',
      success: function (result) {
        that.setData({
          list: result.data[0],
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  toDetail: function (e) {
    var that = this;
    var id = e.currentTarget.id;
    wx.navigateTo({
      url: "/pages/store/instoreConfirm?id=" + that.data.list[id].dispatchlistid,
    });
  },
})