var config = require('../../config')

// importList.js
Page({

  data: {
    dispatchID:0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;

    if (options.id != undefined) {
      that.setData({
        dispatchID: options.id
      });
    }
    //获取已有订单列表
    wx.request({
      url: `${config.service.host}/weapp/storage/queryDispatchList`,
      data:[],
      method: 'GET', 
      success: function(result){
        that.setData({list:result.data})
      },
      fail: function(err){
        console.log(err);
      }
    })
    //获取可用店铺列表
    wx.request({
      url: `${config.service.host}/weapp/storage/store`,
      data: [],
      method: 'GET',
      success: function (result) {
        var x;
        var storeid = new Array();
        var storename = new Array();
        for (x in result.data)
        {
          storeid[x] = result.data[x].storeid;
          storename[x] = result.data[x].name;
        };
        that.setData({
          storeID:storeid,
          storeName:storename
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },

  storeChange: function (e) {
    this.setData({
      storeindex:e.detail.value,
    });
  },

  addList: function () {

  },
})
