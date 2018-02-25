var config = require('../../config')
Page({

  data: {
    list: [],
    storeID: [],
    storeName: [],
    index: 0,
    remark: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var loginInfo = wx.getStorageSync('loginInfo');
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryImportList`,
      data: [loginInfo,
        {}],
      method: 'POST',
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
      url: "/pages/dispatch/arriveDetail?id=" + that.data.list[id].importlistid,
    });
  },
})
